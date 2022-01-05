﻿(function() {
	"use strict";
	
	var lastBarCell = null;
	
	function EdTable(table, options) {
		this.table = table;
		this.options = options;
		
		if (this.options.showBar) table.addEventListener('mousemove', tableMouseMove, true);
	}
	
	EdTable.prototype = {
		reset: function() {
			if (this.table.tHead) this.table.tHead.innerHTML = "";
			else $(this.table).append('<thead />');			
			
			let $tr = $(document.createElement('tr'));
			for (let column of this.options.columns) {
				let attr = "";
				if (column.width) attr = ` style="width:${column.width};"`;
				$tr.append(`<th${attr}>${column.label}</th>`);
			}
			$(this.table.tHead).append($tr);
			
			this.clear();
			this.load();
		},
		
		add: function(data, forceEmpty = false, selectCell = -1) {
				if (!data) data = {};
				let $tr = $(document.createElement('tr'));
				let changeEvent = false;
				for (let column of this.options.columns) {
					let value = data[column.id];
					let attr = "";

					if (forceEmpty && value === undefined) value = "";
					
					switch (column.type) {
						case 'select': 
							if (column.options instanceof Map) {
								if (value == undefined) value = column.options.entries().next().value;
								else value = column.options.has(value) ? column.options.get(value) : "";
							} else if (Array.isArray(column.options)) {
								if (value == undefined) value = column.options[0];
								else if (!column.options.includes(value)) value = "";
							} else value = "";
							
							break;
						case 'check':
							value = `<input type="checkbox" class="edtable-input" ${value?'checked':''} />`;
							attr = ' class="edtable-check"';
							changeEvent = true;
							break;
							
					}

					if (column.width) attr += ` style="width:${column.width};"`;
					
					if (value === undefined) value = "";
					$tr.append(`<td${attr}>${value}</td>`);
				}
				$(this.table.tBodies[0]).append($tr);
				
				if (changeEvent) $tr.find('.edtable-input:checkbox').on('change', inputChange).on('focus', e => {e.target.blur();});
				
				if (this.options.rowHeight) $tr.css('height', this.options.rowHeight);
				let tr = $tr.get(0);
				tr.data = data;
				
				if (selectCell >= 0) this.select(tr.children[selectCell]);
					
				return tr;
		},
		
		del: function() {
				let conf;
				let msg = this.options.deleteMsg || 'Excluir linha?';
				
				let tr = this.cellSelected.closest('tr');
				if (!tr.nextSibling && !tr.previousSibling && this.isEmpty(tr)) return;
				
				if (!this.isEmpty(tr)) {
					if (this.options.confirmDelete) conf = this.options.confirmDelete(msg);
					else conf = confirm(msg);
				} else conf = true;
				
				if (conf) {
					
					let next_tr = tr.previousSibling || tr.nextSibling;
					let next_cell = this.cellSelected.cellIndex;
					
					tr.remove();
					if (next_tr) this.select(next_tr.children[next_cell]);
					else this.add(null, true, next_cell);
				}
		},
		
		clear: function() {
			if (this.table.tBodies.length) this.table.tBodies[0].innerHTML = "";
			else $(this.table).append('<tbody />');			
			
			if (this.options.scrollY) $(this.table.tBodies[0]).css('height', this.options.scrollY);
		},
		
		load: async function(data = null) {
			
			data = data || this.options.data; 
			var rows = null;
			
			if (data) {
				
				if (Array.isArray(data)) rows = data;
				else if (typeof data == "function") {
					try {
						rows = data.call(this.table);	
					} catch(ex) {
						rows = null;
					}
				} else if (typeof this.options.data == "string") {
					rows = await $.ajax({url: this.options.data, dataType: "json"});
				}
			} 
			
			this.clear();

			if (!rows || !rows.length) {
				this.add(null, true);
				return Promise.reject("Nenhum dado carregado");
			}
			
			for (let row of rows) this.add(row);
			
			return true;
		},
		
		get: function() {
			let result = [];
			$(this.table).find('tbody tr').each((idx,tr) => {
				if (this.isEmpty(tr)) return;
				result.push(tr.data);
			});
			
			return result;
		},
		
		isEmpty: function(tr) {
			if (!tr.data) return true;
			
			let data = tr.data;
			
			for (let column of this.options.columns) {
				if (data[column.id]) return false;
			}
			
			return true;
		},
		
		select: function(td) {
			if (!td || this.cellSelected == td || this.cellEditting) return;
			
			$(this.table).find('.edtable-selected').removeClass('edtable-selected');
			$(td).addClass('edtable-selected');
			this.cellSelected = td;
			td.scrollIntoView({block: "nearest", inline: "center"});
		},
		
	    start: function(td, startValue = null, forceSelect = false) {
			
			if (forceSelect) this.select(td);

			if (this.cellSelected != td) {
				this.select(td);
				return false;
			}
		
			if (td.editting) return false;
			
			this.end(true);
			
			if (this.bar) this.hidebar();
			
			
			let column = this.options.columns[td.cellIndex];
			
			if (column.type == 'check') return false;
			
			//Criar editor
			if (!column.editor) {
				let deltaCSS = (dom, css, delta) => {
					let value = window.getComputedStyle(dom).getPropertyValue(css).toString().replace(/[^\d.]/g,'');
					if (value !== '') value = Number(value) + delta;
					return value;
				};
				
				switch (column.type) {
					case 'select': 
						column.editor = document.createElement('select');
						if (column.options instanceof Map) for (let [k, v] of column.options) $(column.editor).append($('<option>').attr('value', k).text(v));
						else for (let v of column.options) $(column.editor).append($('<option>').text(v));
						
						break;
						
					default:
						column.editor = document.createElement('input');
						$(column.editor).attr('type', column.type);
						break;
				}
				
				if (column.attributes) for (let [k,v] of column.attributes) $(column.editor).attr(k,v);
				
				$(column.editor).addClass('edtable-input')
								.css('display', 'none')
								.css('position', 'fixed')
								.css('border', 'none')
								.css('font', window.getComputedStyle(td).getPropertyValue('font').toString())
								.css('padding-left', deltaCSS(td, 'padding-left', -1))
								.css('padding-top', 0)
								.css('background', 'transparent')
								.css('visibility', 'visible');
			}
			
			let rect = td.getBoundingClientRect();
			$(column.editor).css('left', rect.left+1)
							.css('top', rect.top+1)
							.css('width', Math.round(rect.width)-4)
							.css('height', Math.round(rect.height-2));
							
			$(td).css('visibility', 'collapse').append(column.editor);
			
			let value;
			if (column.type == 'select') {
				value = td.childNodes[0].nodeValue;
				
				if (column.options instanceof Map) {
					value = td.childNodes[0].nodeValue;
					for (let [k, v] of column.options) {
						if (v == value) {
							value = k;
							break;
						}
					}
				}
			} else value = $(td).text();
				
			if (column.type == 'select' && column.options instanceof Map) {
				value = td.childNodes[0].nodeValue;
				for (let [k, v] of column.options) {
					if (v == value) {
						value = k;
						break;
					}
				}
			}
			
			if (startValue && column.type != 'select') $(column.editor).val(startValue).css('display', 'block').focus();
			else $(column.editor).val(value).css('display', 'block').focus().select();
			
			$(column.editor).on('keydown', e => {
				if (e.key == 'Enter') {
					this.end(true);
					let next_td  = td.nextSibling;
					
					if (!next_td) {
						let next_tr = td.closest('tr').nextSibling;
						if (next_tr) next_td = next_tr.children[0];
						else return this.add(null, true, 0);
					} else return this.select(next_td);
				}
				
				if (e.key == 'Escape') return this.end(false);
				if (e.key == 'Tab') {
					e.preventDefault();
					let next  = td.nextElementSibling;
					if (next && next.tagName == 'TD') return this.start(next, null, true);
					return this.end(true);
				}
			}).on('blur', e => this.end(true));
			
			if (column.type == 'select') $(column.editor).on('change', inputChange);
			
			
			td.editting = true;
			this.cellEditting = td;
			
			return true;
					
		},
		
		end: function(store = true) {
			if (!this.cellEditting) return false;
			
			let $input = $(this.cellEditting).find('.edtable-input');
			let column = this.options.columns[this.cellEditting.cellIndex];
			
			let value = $input.val();
			
			if (store) {
				if (column.validation) {
					let result = true;
					if (column.validation instanceof RegExp) result = value.toString().match(column.validation);
					if (result && typeof column.validation == 'function') result = column.validation.call({column: column, value: value});
					if (!result) {
						this.select(this.cellEditting);
						$input.focus().select();
						return;
					}
				}
				
				$(this.cellEditting).closest('tr').get(0).data[column.id] = value;
				if (column.type == 'select' && column.options instanceof Map) value = column.options.has(value) ? column.options.get(value) : "";
				$(this.cellEditting).text(value);
			}
			
			$input.css('display', 'none').remove();
			$(this.cellEditting).css('visibility', '');
			
			this.cellEditting.editting = false;
			this.table.focus();
			this.cellEditting = null;
		},
		
		showbar: function(tr) {
			
			if (this.lastBarRow == tr || this.cellEditting) return;
			this.lastBarRow = tr;
			
			if (!this.bar) {
				this.bar = document.createElement('div');
				this.bar.className = "edtable-bar";
				$(this.bar).append('<span class="edtable-up-btn">&#8679;</span>&nbsp;<span class="edtable-down-btn">&#8681;</span>&nbsp;<span class="edtable-del-btn">&#9746;</span>');
			}
			
			$(tr.children[0]).prepend(this.bar);
			
			console.log('show bar', tr);
			
		},
		
		hidebar: function() {
			if (!this.bar || !this.lastBarRow) return;
			
			this.bar.remove();
			this.lastBarCell = null;
			this.lastBarRow = null;
			
			console.log('hide bar');
		}
		
		
	};
	
	function inputChange(e) {
		let table = $(e.target).closest('table').get(0);
		let td = $(e.target).closest('td').get(0);
		let column = table.EdTable.options.columns[td.cellIndex];
		
		if (column.type == 'check' || column.type == 'select') {
			let tr = $(td).closest('tr').get(0);
			tr.data[column.id] = e.target.checked;
			table.EdTable.select(td);
			table.focus();
		}
		
		
	}
	
	function tableKeyDown(e) {
		if (!e.target.EdTable) return;
		
		let edtable = e.target.EdTable;
		let td = edtable.cellSelected;
		
		if (!td) return;
		
		switch (e.key) {
			case "ArrowRight":
				edtable.select(td.nextSibling);
				break;
				
			case "ArrowLeft":
				edtable.select(td.previousSibling);
				break;
				
			case "ArrowDown": {
				let tr = td.closest('tr');
				let next_tr = tr.nextSibling;
				
				if (next_tr) {
					if (e.altKey) {
						tr.closest('tbody').insertBefore(next_tr, tr);
						td.scrollIntoView({block: "nearest", inline: "center"});
					} else edtable.select(next_tr.children[td.cellIndex]);
				} else if (!edtable.isEmpty(tr) && !e.altKey) {
					next_tr = edtable.add(null, true);
					edtable.select(next_tr.children[td.cellIndex]);					
				}
				break;
			}
				
			case "ArrowUp": {
				let tr = td.closest('tr');
				let prev_tr = tr.previousSibling;
				
				if (prev_tr) {
					if (e.altKey) {
						if (!edtable.isEmpty(tr)) {
							tr.closest('tbody').insertBefore(tr, prev_tr);
							td.scrollIntoView({block: "nearest", inline: "center"});
						}
					} else {
						edtable.select(prev_tr.children[td.cellIndex]);
						if (!tr.nextSibling && edtable.isEmpty(tr)) tr.remove();
					}
				}
				
				break;
			}
			
			case "Enter": 
				edtable.start(td);
				break;
				
			case "Tab": {
				e.preventDefault();
				let next_td;
				if (e.shiftKey) {
					next_td = td.previousSibling;
					if (!next_td) {
						let tr = td.closest('tr');
						let prev_tr = tr.previousSibling;
						if (prev_tr) next_td = prev_tr.children[prev_tr.children.length-1];
						if (!tr.nextSibling && edtable.isEmpty(tr)) tr.remove();
					}
					
				} else {
					next_td = td.nextSibling;
					if (!next_td) {
						let next_tr = td.closest('tr').nextSibling;
						if (next_tr) next_td = next_tr.children[0];
					}
				}
				
				edtable.select(next_td);
				
				break;
			}
			
			case "Delete": 
				edtable.del();
				break;
				
			default:
				if (e.key.length == 1) {
					e.preventDefault();
					let column = edtable.options.columns[td.cellIndex];
					
					if (e.key == " ") {
						if (column.type == 'check') {
							let input = $(td).find('input:checkbox').get(0);
							if (input) input.checked = !input.checked;
							return;
						} 
					} else {
						if (column.type == 'select') {
							let value = td.childNodes[0].nodeValue;
							
							if (column.options instanceof Map) {
								for (let [k, v] of column.options) {
									if (value) {
										if (v == value) value = null;
									} else if (v[0].toUpperCase() == e.key.toUpperCase()) {
										value = [k,v];
										break;
									}
								}
								
								if (!value) for (let [k, v] of column.options) if (v[0].toUpperCase() == e.key.toUpperCase()) {value = [k,v]; break;}
								if (value) {
									td.closest('tr').data[column.id] = value[0];
									$(td).text(value[1]);
									return;
								}
							} else {
								for (let v of column.options) {
									if (value) {
										if (v == value) value = null;
									} else if (v[0].toUpperCase() == e.key.toUpperCase()) {
										value = v;
										break;
									}
								}
								
								if (!value) for (let v of column.options) if (v[0].toUpperCase() == e.key.toUpperCase()) {value = v; break;}
								if (value) {
									td.closest('tr').data[column.id] = value;
									$(td).text(value);
									return;
								}
							}
							
							
							
							
						}
						
					}
					
					edtable.start(td, e.key);
				}
		}
	}	
	
	function tableMouseMove(e) {
		let elem = document.elementFromPoint(e.clientX, e.clientY);
		if (!elem || lastBarCell == elem) return;
		lastBarCell = elem;

		let table = elem.closest('table');
		if (elem.tagName != 'TD' && elem.tagName != 'INPUT' && elem.tagName != 'DIV') return table.EdTable.hidebar();
		
		table.EdTable.showbar(elem.closest('tr'));
	}
	
	
	function initEdTable(table, options) {
		if (!table instanceof HTMLTableElement) return null;
		
		$(table).find('tbody,thead,tr').remove();
		
		table.className = table.className ? "edtable " + table.className.replace(/\s*edtable\s*/g, "") : "edtable";
		
		options.fixedHeader = options.scrollY !== undefined || options.fixedHeaderClass;
		
		if (options.fixedHeader) $(table).addClass("edtable-fixed-header");
		if (options.fixedHeaderClass) $(table).addClass(options.fixedHeaderClass);
		
		let unit = null;
		let acum = 0;
		
		for (let column of options.columns) {
			
			if (!column.width && options.fixedHeader) column.width = '1rs';
			
			if (column.width) {
				let m;
				if (m = column.width.toString().match(/\s*(\d+(?:\.\d+)?)\s*(%|px|rs)?/i)) {
					column.width = Number(m[1]);
					if (!unit && m[2]) unit = m[2];
					acum += column.width;
				} else column.width = 0;
			}
			
			switch (column.type) {
				case 'select': 
					if (typeof column.options == "string") {
						let select_options;
						let opts = column.options.split(",");
						
						if (column.options.indexOf("=") != -1) {
							select_options = new Map();
							
							for (let opt of opts) {
								opt = opt.split("=");
								select_options.set(opt[0].trim(), (opt.length > 1) ? opt[1].trim() : opt[0].trim());
							}
						} else  select_options = opts;
						
						column.options = select_options;
					}
					
					break;
			}
		}
		
		if (acum) {
			for (let column of options.columns) {
				if (unit && unit != 'px') {
					if (acum && unit == 'rs') column.width = (column.width / acum) * 100;
					column.width += '%';
				} else column.width += 'px';
			}
		}
		
		
		if (options.scrollY && typeof options.scrollY == 'number' && options.rowHeight) options.scrollY *= options.rowHeight;
		
		table.EdTable = new EdTable(table, options);
		table.EdTable.reset();
		
		$(table).on('click', e => {
			if (e.target.tagName == 'TD') {
				e.preventDefault();
				table.EdTable.start(e.target); 
			}
		});
		
		$(table).attr('tabindex', -1).on('keydown', tableKeyDown);
		
		
		if ($(table).is(".edtable-fixed-header")) {
			
			const resizeObserver = new ResizeObserver(entries => {
				for (let entry of entries) {
					let tr_width;
					if(entry.contentBoxSize) {
					  // Firefox implements `contentBoxSize` as a single content rect, rather than an array
					  const contentBoxSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;
					  tr_width = contentBoxSize.inlineSize;
					} else tr_width = entry.contentRect.width;
					let table = entry.target.parentElement;
					$(table).find('thead tr').css('width', tr_width + 'px');
				}
			});

			resizeObserver.observe(table.tBodies[0]);		
		}
		
	}

	$.fn.edtable = function(options) {
		if (!options) options = {};
		
		let default_options = {scrollY: undefined,					// Altura máxima do corpo da tabela :: <number | string>
							   rowHeight: undefined,				// Altura em pixel da linha quando se especifica o scrollY em linhas
							   fixedHeaderCLass: undefined,			// Classe que define propriedades da tablea de cabeçalho fixo
							   scrollX: undefined,					// Largura máxima da tabela :: <number | string>
							   data: undefined,						// JSON, XML ou Array com os dados para preenchimento da tabela
							   columns: undefined,					// Array com as definições das colunas da tabela
							   loadingMsg: "Carregando...",			// Mensagem de carregamento dos registros
							   confirmDelete: undefined,			// Função da confirmação de exclusão
							   deleteMsg: undefined,				// Mensagem de exclusão
							   infoRecords: true,					// Exibir informações de registros 
							   order: 1,							// Indicação da coluna de ordenação da tabela. ex: -2 --> ordenação decrescente pela segunda coluna
							   showBar: false						//Exibir barra de comandos
							   };
							   
		for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] !== undefined && options[prop] == undefined) options[prop] = default_options[prop];
		$(this).each((index, target) => initEdTable(target, options));
		return this;
	}
	
	return $.fn.edtable;
}());
