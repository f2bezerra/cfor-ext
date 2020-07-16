/***************************************************/
/* Editor de Texto Padrão do SEI                   */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

$(function() {
	$('#frmTextoPadraoInternoCadastro').on("submit",function(e) {
		var ifr = document.querySelector("#cke_2_contents iframe");
		var doc = ifr.contentDocument || ifr.contentWindow.document;
		
		$(doc).find('code').each((index, code) => $(code).text($(code).text()));

		var html = doc.body.innerHTML;
		
		html = html.replace(/<p[^>]*>%INIT\([\w\W]*?%<\/p>/ig,"");
			
		if (html.match(/%(?:\s|&nbsp;)*?[\w_]+(?:@.+|\([^)]*?\))?(?:\s|&nbsp;)*?%|{#(?:if|else|endif|\?)\b[^}]*?}/i)) {
			let trim_fn = function (src) {
				const regex = /%(?:\s|&nbsp;)*([\w_*]+)(?:\s|&nbsp;)*(?:\((.*)\))?(?:\s|&nbsp;)*%/ig;
				return src.replace(regex, (m0, m1, m2) => {
					return "%" + m1 + (m2?`(${trim_fn(m2.replace(/&nbsp;/ig," ").trim())})`:"") + "%"; 
				});
			};
			
			html = trim_fn(html);
			
			html = html.replace(/<p\b[^>]*?>(?:\s|&nbsp;|<\w+\b[^>]*?>|<\/[^p]\w+>|<\/[^p]>|<\/p[^>]+>)*?<code\b[^>]*?>\s*?({#(?:if|else|endif|\?)\b[^}]*?})\s*?<\/code>(?:\s|&nbsp;|<\w+\b[^>]*?>|<\/\w+>)*?<\/p>/ig, function (m0, m1) {
				return `<p><code spellcheck="false">${m1}</code></p>`;
			});

			html = html.replace(/<code\b[^>]*?>(?:\s|&nbsp;)*({#(?:if\b[^}]*?|else|endif|\?)})(?:\s|&nbsp;)*<\/code>/ig, function (m0, m1) {
				return `<code spellcheck="false">${m1}</code>`;
			});
		}
		
		html = html.replace(/<span>([\w\W]*?)<\/span>/ig, "$1"); //Excluir todos spans vazios
		
		let str_init = "%INIT(@tipo_processo@,@especificacao_processo@,@cpf_interessado@,@cnpj_interessado@,@cpf_destinatario@,@cnpj_destinatario@)%";
		if (html.match(/%field\([^)]+\)%|\$\w+/i)) str_init += "%FIELDS(@observacao_processo@)%";
		if (html.match(/%ref\([^)]+\)%/i)) str_init += "%REFS(@observacao_documento@)%";

		html = `<p style="display: none;">${str_init}</p>` + html;

		$(doc.body).html(html);
	});

	if (!document.getElementById("ancAjudaCfor")) {
		var $last_col = $('#frmTextoPadraoInternoCadastro table tbody tr td:last-child');
		var a = $('<a id="ancAjudaCfor" title="Ajuda da extensão CFOR" tabindex="504"> <img class="infraImg"></a>');
		$last_col.append('<br>').append(a);
		$("#ancAjudaCfor img").attr("src", browser.runtime.getURL("assets/logo-48.png"));
		$("#ancAjudaCfor").on("click", function (e) {
			chrome.runtime.sendMessage({action: "popup", url: browser.runtime.getURL("doc/txtpadrao-ajuda.html"), options: {width: 1000, height: 600}});
		});  
	}

	var hs = setInterval(function() {

		var doc = (ifr = document.querySelector("#cke_2_contents iframe")) && (ifr.contentDocument || ifr.contentWindow.document);
		
		if (!(main_toolbox = document.getElementById("cke_2_toolbox")) || !doc || doc.readyState != "complete") return;
		clearInterval(hs);

		//Lista de campos para inserção no texto padrão
		var fdfns = [{group: "Campos",
					  classItem: "cfor-li-field",
					  items: [{text: "cod_servico", desc: "Código do Serviço"},
							  {text: "desc_servico", desc: "Descrição do Serviço", format: "up|low"},
							  {text: "ind_servico", desc: "Indicativo do Serviço", format: "up|low"},
							  {text: "sigla_servico", desc: "Sigla do Serviço", format: "up|low"},
							  {text: "cpfj_int", desc: "CPF ou CNPJ do Interessado", format: "*|num"},
							  {text: "desc_cpfj_int", desc: "Descrição do CPF ou CNPJ do Interessado", format: "*|num"},
							  {text: "cpfj_dest", desc: "CPF ou CNPJ do Destinatário", format: "*|num"},
							  {text: "desc_cpfj_dest", desc: "Descrição do CPF ou CNPJ do Destinatário", format: "*|num"},
							  {text: "is_int_pf", desc: "Indicador se o interessado é Pessoa Física"},
							  {text: "is_int_pj", desc: "Indicador se o interessado é Pessoa Jurídica"},
							  {text: "is_dest_pf", desc: "Indicador se o destinatário é Pessoa Física"},
							  {text: "is_dest_pj", desc: "Indicador se o destinatário é Pessoa Jurídica"},
							  {text: "is_sarc", desc: "Indicador se o processo é de SARC"},
							  {text: "usu_sei_ok", desc: "Indicador se o existe Usuário Externo SEI regular"},
							  {text: "seq", desc: "Retornar valor de sequencial", value: "seq_<nome>?"}]},
							  
		             {group: "Funções",
					  classItem: "cfor-li-function",
					  items: [{text: "ep_has", desc: "Testar contéudo do campo especificação do processo", value: "ep_has(<expressão>?)"},
					  
							  {text: "var", desc: "Retornar valor de variável", value: "var(<nome@up|low|ano|num>?;<tipo:text,check,calendar,choice>?;<rótulo>?;<padrão>?)"},
							  {text: "field", desc: "Retornar valor de campo de processo", value: "field(<nome@up|low|ano|num>?;<padrão>?)"},
							  {text: "ref", desc: "Retornar valor de referência", value: "ref(<nome:sei@link,num,ano@2|4,data@ext,id@up|low>?;<padrão>?)"},
							  {text: "extrato", desc: "Retornar extrato", value: "extrato(<fistel>?;<status:Q=Quitado,D=Devedor,P=Pendente>?;<filtro:{fistel,receita,ano,vencto,valor,status}>?)"},
							  {text: "link_boleto", desc: "Retornar link de boleto", value: "link_boleto(<texto>?;<fistel>?;<cpfj>?)"}]}];
							  
		var insert_fdfn = function(data) {
			let sel = doc.getSelection();
			
			if (sel.rangeCount > 1) return;

			let h, is_fun_template;
			
			
			if (is_fun_template = (data.match(/[^<]*\<[^>]*?\>\?.*/) != null)) {
				//data = data.replace(/<([^>:]*?)(?::([^>]*?))?>\?/g, '<span contenteditable="true" spellcheck="false" list="$2">$1</span>');
				data = data.replace(/<([^>:@]*?)(?::([^>]*?)|@([^>]*?))?>\?/g, '<span contenteditable="true" spellcheck="false" list="$2" format="$3">$1</span>');
			}

			//Verificar se aplica destaque do campo
			let nd = sel.anchorNode;
			let text = sel.anchorNode.textContent.substring(0, sel.anchorOffset);
			while (nd = nd.previousSibling) text = (nd.nodeType==3?nd.textContent:nd.innerText) + text;
			
			let withHighLight = (text.match(/{#(?:if\s+|\?)[^}]*$/i) == null);
			
			
			if (is_fun_template) {
				let $node_fn = $("<span></span>").addClass("cfor-function-editor").prop("contenteditable", "false").prop("spellcheck", "false").append(data);	
				if (withHighLight) $node_fn.css("background-color", "#ff0");

				let range = sel.getRangeAt(sel.rangeCount-1);
				range.deleteContents();
				range.insertNode($node_fn[0]);
				
				let collapse_fn = function(start) {
					let node_content = $node_fn.text().replace(/;{2,}/g, ";").replace(/;\)%$/g, ")%");
					let node = doc.createTextNode(node_content);
					
					range = doc.createRange();
					range.selectNode($node_fn[0]);
					range.deleteContents();
					
					if (withHighLight) {
						node = $("<span></span>").append(node).get(0);
						$(node).css("background-color", "#ff0");
					} 
					
					range.insertNode(node);
					if (start != undefined) range.collapse(start);
					
					sel.removeAllRanges();
					sel.addRange(range);
				};
				
				$node_fn.on("focusout", function(e) {
					if(e.relatedTarget && Object.is(e.relatedTarget.parentElement,e.target.parentElement)) return;
					
					e.preventDefault();
					e.stopPropagation();
					collapse_fn();
					return false;
				});
				
				$node_fn.find("span").on("keydown", function(e) {
					
					switch (e.key) {
						case "Tab":
							e.preventDefault();
							e.stopPropagation();
							let $node;
							if (e.shiftKey) {
								let $node = $node_fn.find(":focus").prev("span");
								if ($node.length) $node.focus();
								else collapse_fn(true);
							} else {
								let $node = $node_fn.find(":focus").next("span");
								if ($node.length) $node.focus();
								else collapse_fn(false);
							}
							return;
							
						case "Enter":
							e.preventDefault();
							e.stopPropagation();
							e.stopImmediatePropagation();
							if (e.ctrlKey) {
								$node_fn.find(":focus").nextAll("span").text("");
								collapse_fn(false);
							} else {
								let $nde = $node_fn.find(":focus").next("span");
								if ($nde.length) $nde.focus();
								else collapse_fn(false);
							}
							return;

						case "Escape":
							e.preventDefault();
							e.stopPropagation();
							collapse_fn(false);
							return;
					}
					
				}).on("focus", function(e) {
					range = doc.createRange();
					range.selectNodeContents(this);
					sel.removeAllRanges();
					sel.addRange(range);
					let node = range.startContainer;
					if (node.intellisense) {
					    let lst = $(node).attr("list");
						if (!lst || lst[0] == "{") return;
						let v = $(node).text();
						if (v && v.indexOf(":") >= 0) v = v.substr(0, v.indexOf(":"));
						if (!v || !lst.includes(v)) node.intellisense.open(lst, lst[0]);
					} 
				}); 
				
				$node_fn.find("span").each(function() {
					if ($(this).attr("list")/*this.hasAttribute("list")*/) {
						let tk = $(this).attr("list")[0] == "{" ? "{" : "@";
						enableIntellisense(this, {onlyTokens: false,
												  tokens: "@{",
												  delimiters: [null, "{}"],
												  classItem: "cfor-li-intellisense",
												  list: function(d) {
													  let lst = $(this).attr("list");
													  
													  if (lst[0] == "{") {
													      if (d.token != "{") return false;
														  return lst.replace(/[{}]/g, "");
													  }
													  
													  if (!d) return lst.replace(/@[^,]+/g, "");
													  
													  if (d.previous) {
														  let regex = new RegExp(`${d.previous}@([^,]+)`, "i");
														  if (m = regex.exec(lst)) return m[1].split("|").map((v) => {return {text: v, class: "cfor-li-format"}});
													  }
													  
													  return false;
												  }});
					} else if ($(this).attr("format")) {
						enableIntellisense(this, {onlyTokens: true,
												  tokens: "@",
												  classItem: "cfor-li-format",
												  list: function(d) {
													  let fmt = $(this).attr("format");
													  return fmt.replace(/\|/g,",");
												  }});
					}
				});				
				
				$node_fn.find("span:first").focus();
				
			} else {

				let range = sel.getRangeAt(sel.rangeCount-1);
				range.deleteContents();

				node = doc.createTextNode(data);
			
				//highlight
				if (withHighLight) node = $("<span></span>").css("background-color", "#ff0").append(node).get(0);
				range.insertNode(node);
				if (h) { 
					if (withHighLight) node = node.childNodes[0];
					range = doc.createRange();
					range.setStart(node, h);
					range.setEnd(node, h+1);
					sel.removeAllRanges();
					sel.addRange(range);
				} else if (!withHighLight) range.collapse(false);
			}
		};		
		
		//--- Criar barra e botões de ferramenta
		var toolbar = create_toolbar(main_toolbox);
		var btn_field = add_btn(toolbar, "cke_cfor_field", "Inserir Campos e Funções", "field.png", {list: fdfns, enabled: false}, insert_fdfn);
		var btn_filter = add_btn(toolbar, "cke_cfor_filter", "Editar Filtros", "filter.png", {enabled: false});
		add_separator(toolbar);
		var btn_cpyfmt = add_btn(toolbar, "cke_cfor_cpyfmt", "Copiar estilo de célula", "brush.png", {toggleable: true, enabled: false});
		var btn_bm = add_btn(toolbar, "cke_cfor_bm", "Setar marcador", "bm.png", {enabled: false});
		add_separator(toolbar);
		var btn_tb = add_btn(toolbar, "cke_cfor_tb", "Criar/Editar Tabela Dinâmica", "fill-table.png", {enabled: false});

		
		//--- Função de edição de filtro e marcador
		var	tr_tooltip_options = {clip: "2 12", attr: "condition", html: '<span class="tooltip-condition">Condição: </span> <span class="tooltip-content">$0</span>', cursor: "default", onclick: function() {edit_filter(this)}};
		var	li_tooltip_options = {clip: "absolute -20 2 -8 12", attr: "condition", html: '<span class="tooltip-condition">Condição | </span> <span class="tooltip-content">$0</span>', cursor: "default", onclick: function() {edit_filter(this)}};
		var bm_tooltip_options = {clip: "-12 2 -2 12", attr: "bookmark", html: '<span class="tooltip-bookmark">Marcador: </span> <span class="tooltip-content">$0</span>', cursor: "default", onclick: function() {edit_bookmark(this)}};
		var table_tooltip_options = {attr: "dynamic-table-data", html: '<span class="tooltip-data-fill">Dados: </span> <span class="tooltip-content">$0</span>'};
		
		//--- Opções de intellisense
		var edit_intellisense_options =	{tokens: "%", list: fdfns, onSelect: function(e) {
			let new_value = "%" + e.value.replace(/<([^:>]+)[^>]*?>\?/g, "$1") + "%";
			let v = $(this).val();
			v = v.substring(0, e.range.start) + new_value + v.slice(e.range.end);
			$(this).val(v);
			
			if ((ini = new_value.indexOf("(")) > 0 && (fin = new_value.indexOf(")", ini)) > 0) {
				this.selectionStart = e.range.start + ini + 1;
				this.selectionEnd = e.range.start + fin;
			}
		}};
		
		var sigec_intellisense_options = {onlyTokens: false, list: "fistel,seq,rec,vencto,valor,status", onSelect: (e) => {return `{${e.value}}`}};					
		
		
		var edit_filter = function(elems) {
			
			let condition = undefined;
			if (!Array.isArray(elems)) elems = [elems];
			
			//definir condição default 
			elems.forEach((item, index) => {
				let c = $(item).attr("condition");
				if (condition && c && c != condition) {
					condition = "";
					return false;
				}
				condition = c;
			});
		
			
			open_dialog("cfor_condition_dlg", `Condição de ${elems[0].nodeName == "TR"?"Linha":"Item"}`, 400, 100, "Limpar",
						[{id: "cfor_condition", type: "textarea", label: "Condição", label_position: "top", rows: 5, cols: 20, value: condition, intellisense: edit_intellisense_options}], (a, f) => {
							if (a == "limpar") f.cfor_condition = null;
							else if (a != "ok") return true;
							
							

							condition = f.cfor_condition?f.cfor_condition.trim():undefined;
							elems.forEach((item, index) => {
								if (condition) $(item).attr("condition", condition).removeAttr("title").tooltip(item.nodeName == "TR"?tr_tooltip_options:li_tooltip_options);
								else $(item).removeAttr("condition").removeAttr("title").untooltip();
							});
							return true;
						});
			
		};
		
		// Ação do botão de marcador
 		var edit_bookmark = function(elem) {
				
			open_dialog("cfor_bookmark_dlg", "Marcador", 200, 50, "Limpar",
						[{id: "cfor_bookmark", type: "text", label: "Identificador:", label_position: "top", value: $(elem).attr('bookmark')}], (a, f) => {

				if (a == "limpar") f.cfor_bookmark = null;
				else if (a != "ok") return true;
				
				let bm = f.cfor_bookmark?identityNormalize(f.cfor_bookmark):undefined;
				if (bm) $(elem).attr('bookmark', bm).removeAttr('title').tooltip(bm_tooltip_options);
				else $(elem).removeAttr('bookmark').removeAttr('title').untooltip();
				
				return true;
			});
							
		};		
		
		// Ação do botão de filtro
 		btn_filter.fn = function (e) {
			let sel = doc.getSelection();
			
			if (!sel.isCollapsed) {
				let range = sel.getRangeAt(0);
				let is_boundery = function(node, offset, delta) {
					if (!node) return true;
					if ((delta < 0 && offset) || (delta > 0 && offset < node.length)) return false;
					if (delta < 0) node = node.previousSibling; else node = node.nextSibling;
					while (node && node.nodeName == "BR") if (delta < 0) node = node.previousSibling; else node = node.nextSibling;
					return (!node);
				};
				
				//Condição de bloco
				if (range.commonAncestorContainer.nodeName.match(/BODY|DIV/) || (is_boundery(range.startContainer, range.startOffset, -1) &&  (is_boundery(range.endContainer, range.endOffset, 1)))) {
					let node = doc.createElement("p");
					let code = doc.createElement("code");
					code.setAttribute("spellcheck", "false");
					code.appendChild(doc.createTextNode("{#endif}"));
					node.appendChild(code);
					$(code).mouseenter(highlight_code).mouseleave(unhighlight_code);

					
					let $lst = $(range.endContainer.parentElement).closest("ul,ol,li");
					if ($lst.length) $lst.get(0).insertAdjacentElement("afterend", node);
					else range.endContainer.parentElement.insertAdjacentElement("afterend", node);

					node = doc.createElement("p");
					code = doc.createElement("code");
					code.setAttribute("spellcheck", "false");
					let if_node = doc.createTextNode("{#if _}");
					code.appendChild(if_node);
					node.appendChild(code);
					$(code).mouseenter(highlight_code).mouseleave(unhighlight_code);
					
					$lst = $(range.startContainer.parentElement).closest("ul,ol,li");
					if ($lst.length) $lst.get(0).insertAdjacentElement("beforebegin", node);
					else range.startContainer.parentElement.insertAdjacentElement("beforebegin", node);
					
					sel.removeAllRanges();
					range.detach();
					range = doc.createRange();
					range.selectNode(if_node);
					range.setStart(if_node, 5);
					range.setEnd(if_node, 6);
					sel.addRange(range);
					
					return;
				}
			}

			let elem = undefined;
			if (sel.anchorNode.nodeName == "TR" || (sel.isCollapsed && sel.rangeCount == 1 && (elem = $(sel.anchorNode).closest('tr').get(0) || $(sel.anchorNode).closest('li').get(0)))) {
				var elems = [], filter_condition = undefined;

				if (elem) elems.push(elem);
				else {
					for(i = 0; i < sel.rangeCount; i++) {
						let range = sel.getRangeAt(i);
						if (Object.is(range.startContainer, elem)) continue;
						elems.push(range.startContainer);
					}
				}
				
				edit_filter(elems);
				return;
			}
			
			//condição de linha
			if (sel.rangeCount == 1 && !sel.isCollapsed) {
				let range = sel.getRangeAt(0);
				let node = doc.createTextNode("{#if _}");
				var documentFragment = range.extractContents();
				
				let code = doc.createElement("code");
				code.setAttribute("spellcheck", "false");
				code.appendChild(doc.createTextNode("{#endif}"));
				range.insertNode(code);
				$(code).mouseenter(highlight_code).mouseleave(unhighlight_code);
				
				range.insertNode(documentFragment);
				
				code = doc.createElement("code"); 
				code.setAttribute("spellcheck", "false");
				code.appendChild(node);
				range.insertNode(code);
				$(code).mouseenter(highlight_code).mouseleave(unhighlight_code);

				sel.removeAllRanges();
				range = doc.createRange();
				range.setStart(node, 5);
				range.setEnd(node, 6);
				sel.addRange(range);
			}
		};
		

		// Ação do botão de marcador
 		btn_bm.fn = function (e) {
			let sel = doc.getSelection();
			if (sel.rangeCount != 1) return;
			if (td = $(sel.anchorNode.parentElement).closest('td').get(0)) edit_bookmark(td);
		};
		
		// Ação do botão de tabela dinâmica
 		btn_tb.fn = function (e) {
			let sel = doc.getSelection();
			if (sel.rangeCount != 1) return;
			
			let node = sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentElement : sel.anchorNode;
			let table = $(node).closest('table[dynamic-table]').get(0);
			let default_id = $(table).attr("dynamic-table-id");
			let default_table = $(node).closest('table[dynamic-table]').attr('dynamic-table');
			let default_data = "";

			if (d = $(table).attr("dynamic-table-data")) {
				let default_fistel = "";
				let default_status = "";
				let default_periodo = undefined;
				
				if (v = d.match(/&?\bfistel=(.*?)(?=&\w+=|$)/i)) default_fistel = v[1];
				if (v = d.match(/&?\bstatus=(.*?)(?=&\w+=|$)/i)) default_status = v[1];
				if (v = d.match(/&?\bini=(.*?)(?=&\w+=|$)/i)) default_periodo = [v[1]];
				
				if (v = d.match(/&?\bfin=(.*?)(?=&\w+=|$)/i)) {
					if (!default_periodo) default_periodo = [""];
					default_periodo.push(v[1]);
				}
				
				if (default_table == "lancto" && default_fistel) {
					default_data = "%extrato(" + default_fistel;
					if (default_status) {
						default_data += ", " +  default_status;
						if (default_periodo) {
							if (default_periodo[0]) default_data += ", {vencto} >= " + default_periodo[0];
							if (default_periodo[1]) default_data += (default_periodo[0] ? " AND " : ", ") + "{vencto} <= " + default_periodo[1];
						}
					}
					default_data += ")%";
					
				} else default_data = d;
			}
			
			open_dialog("dtable_dlg", "Tabela Dinâmica", 400, 50, "Limpar",
						[{id: "id", type: "text", label: "Id:", label_position: "top", value: default_id},
						 {id: "tabela", type: "select", label: "Tabela:", label_position: "top", items: "lancto=Lançamentos", value: default_table},
						 {id: "dados", type: "text", label: "Dados:", label_position: "top", value: default_data, intellisense: edit_intellisense_options}], (a, f) => {

				if (a == "limpar") {
					f.id = "";
					f.dados = "";
					return false;
 				} else if (a != "ok") return true;
				
				let columns;
				switch (f.tabela) {
					case "lancto": columns = [{header: "Fistel", class: "Tabela_Texto_Centralizado", bind: "fistel"},
											  {header: "Seq", class: "Tabela_Texto_Centralizado", bind: "seq"},
											  {header: "Receita", class: "Tabela_Texto_Alinhado_Esquerda", bind: "receita"},
											  {header: "Ano", class: "Tabela_Texto_Centralizado", bind: "ano"},
											  {header: "Vencimento", class: "Tabela_Texto_Centralizado", bind: "vencto"},
											  {header: "Valor", class: "Tabela_Texto_Alinhado_Direita", bind: "valor"},
											  {header: "Situação", class: "Tabela_Texto_Centralizado", bind: "situacao"}];
								   break;
				}

				
				if (table) {
					if (default_table && default_table != f.tabela) {
						$(table).find('thead,tbody,tr').remove();
						$(table).append('<thead />');
						$(table).append('<tbody />');
						
						let $tr_thead = $('<tr />');
						let $tr_tbody = $('<tr />');
						
						columns.forEach(c => {
							$tr_thead.append(`<th><p class="${c.class}">${c.header}</p></th>`);
							$tr_tbody.append(`<td><p class="${c.class}">{${c.bind}}</p></td>`);
						}); 
						
						$(table).find('thead').append($tr_thead);
						$(table).find('tbody').append($tr_tbody);
					}
					
					$(table).attr("dynamic-table", f.tabela).attr("dynamic-table-id", f.id).attr("dynamic-table-data", f.dados);
				} else {
					let $table = $(`<table dynamic-table="lancto" dynamic-table-id="${f.id}" dynamic-table-data="${f.dados}" cellspacing="0" cellpadding="0" border="1" style="margin-left:auto;margin-right:auto;" spellcheck="false">
										<thead />
										<tbody />
									</table>`);

					let $tr_thead = $('<tr />');
					let $tr_tbody = $('<tr />');
					
					columns.forEach(c => {
						$tr_thead.append(`<th><p class="${c.class}">${c.header}</p></th>`);
						$tr_tbody.append(`<td><p class="${c.class}">{${c.bind}}</p></td>`);
					}); 
					
					$table.find('thead').append($tr_thead);
					$table.find('tbody').append($tr_tbody);
					
					let range = sel.getRangeAt(0);
					range.insertNode($table.get(0));
					range.collapse();
					$(node).closest("p").removeAttr('class');
					$table.tooltip(table_tooltip_options);
				}
				
				return true;
			});
			
		};
		
		
		btn_cpyfmt.fn = function (e) {
			if (e.currentTarget.checked()) return true;
			
			let p, sel = doc.getSelection();
			if (sel.rangeCount > 1 || !(p = $(sel.focusNode.parentElement).closest('td').find('p:first').get(0))) return false;
			
			e.currentTarget.styleCopied = p.className;
			return true;
		};
		
		var search_next = function(elem, filter, html) {
			let next = elem.nextElementSibling || (elem.parentElement && elem.parentElement.nextElementSibling) || elem.firstElementChild; 
			
			if (!next) {
				elem = elem.parentElement;
				while (elem && !elem.nextElementSibling) elem = elem.parentElement;
				next = elem && elem.nextElementSibling;
			}

			while (elem) {
				while (next) {
					if (typeof filter == "string") {
						if ($(next).is(filter)) return next;
						if (result = $(next).find(filter).get(0)) return result;
					} else if (filter.test(html?next.innerHTML:next.innerText)) return next; 	

					if (next.childElementCount && (result = search_next(next, filter, html))) return result;
					next = next.nextElementSibling
				}
				
				elem = elem.parentElement && elem.parentElement.nextElementSibling;
				next = elem;
			}
			
			return undefined;
		}; 
		
		//Funções de destaque de partes do testo padrão
		var highlight_code = function(e) {
			$(doc).find('code.highlighted').removeClass('highlighted');
			$(e.currentTarget).addClass('highlighted');
			if ((scode = $(e.currentTarget).text()) && scode.match(/{#if\b|{#else\b/i)) {
				let next = search_next(e.currentTarget, "code:contains('{#'):not(:contains('{#?'))");
				if (!e.currentTarget.nextSibling) {
					while (next && (next.nextSibling || next.previousSibling)) {
						next = search_next(next, "code:contains('{#'):not(:contains('{#?'))");
					}
				}
				if (next) $(next).addClass('highlighted');
				
			}
		};
		
		var unhighlight_code = function(e) {$(doc).find('code.highlighted').removeClass('highlighted')};
		
		var show_condition = function(e) {
			if (e.offsetX < 14) {
				if (!this.hasAttribute('condition')) this.setAttribute('condition', $(this).closest('[condition]').attr('condition'));
				$(this).addClass('condition_hover');
			} else $(this).removeClass('condition_hover');
		};
		
		
		//Eventos do documento
		waitDocumentReady(doc).then(function() {
			var linkElement = doc.createElement('link');
			linkElement.setAttribute('data-cke-temp', '1');
			linkElement.setAttribute('rel', 'stylesheet');
			linkElement.setAttribute('href', browser.runtime.getURL("lib/general.css"));
			doc.getElementsByTagName('head')[0].appendChild(linkElement);			
			
			linkElement = doc.createElement('link');
			linkElement.setAttribute('data-cke-temp', '1');
			linkElement.setAttribute('rel', 'stylesheet');
			linkElement.setAttribute('href', browser.runtime.getURL("lib/intellisense.css"));
			doc.getElementsByTagName('head')[0].appendChild(linkElement);			

			linkElement = doc.createElement('link');
			linkElement.setAttribute('data-cke-temp', '1');
			linkElement.setAttribute('rel', 'stylesheet');
			linkElement.setAttribute('href', browser.runtime.getURL("lib/sei.css"));
			doc.getElementsByTagName('head')[0].appendChild(linkElement);			
			
			
			$(doc).find('code').mouseenter(highlight_code).mouseleave(unhighlight_code);
			$(doc).find('tr[condition]').tooltip(tr_tooltip_options);
			$(doc).find('li[condition]').tooltip(li_tooltip_options);
			$(doc).find('td[bookmark]').tooltip(bm_tooltip_options);
			$(doc).find('table[dynamic-table]').tooltip(table_tooltip_options);
			
			$(doc).on("focus click", (evt) => {
				en_btn(btn_field);
				en_btn(btn_filter);
				en_btn(btn_cpyfmt);
				en_btn(btn_bm);
				en_btn(btn_tb);
			});

			$(doc).on("blur", (evt) => {
				dis_btn(btn_filter);
				dis_btn(btn_field);
				dis_btn(btn_cpyfmt);
				dis_btn(btn_bm);
				dis_btn(btn_tb);
				btn_cpyfmt.checked(false);
			});
			
			$(doc).on('keydown', function(e) {
				if (e.keyCode == 27 || e.which == 27) {
					$(".cfor_button_list_on").each((index, elem) => {elem.hideList();});
					return;
				}
			});
			
			enableIntellisense(doc, {tokens: "%@", 
			
									 includePreviousChars: "$",
			
									 list: function(e) {
										 if (e.token == "%") return fdfns; 
										 
										 if (e.token == "@" && e.previous) {
											 let fds = fdfns[0].items;
											 e.previous = e.previous.toLowerCase();
											 
											 let format = "";
											 if (e.previous[0] == "$") format = "up|low|num|ano";
											 else if (f = fds.find((i) => {return (i.format && i.text == e.previous)})) format = f.format;
											 
											 if (format) return format.split("|").map((v) => {return {text: v, class: "cfor-li-format"}});
											 
											 //if (f = fds.find((i) => {return (i.format && i.text == e.previous)})) return f.format.split("|").map((v) => {return {text: v, class: "cfor-li-format"}});
										 }
										 
										 return false;
									 }, 
									 
									 onSelect: function(e) {
										 if (e.token == "%") {
											insert_fdfn(`%${e.value}%`);
											return;										 
										 }
										 
										 if (e.token == "@") return `@${e.value}`;
									 }
			});
									 
			$(doc).on('input', function(e) {
				let sel = doc.getSelection();
				if (sel.rangeCount > 1) return;
				let range = sel.getRangeAt(0);
				
				if (e.originalEvent.inputType.includes("deleteContent") && (code = $(range.startContainer).is('code') ? range.startContainer : $(range.startContainer.parentElement).is('code') ? range.startContainer.parentElement : null)) {
					if ($(code).text().match(/{#(?:if\s*?|else|endif|\?)[^}]*?}/i)) return;
					node = doc.createTextNode($(code).text());
					range = doc.createRange();
					range.selectNode(code);
					range.extractContents();
					range.insertNode(node);

					sel.removeAllRanges();
					sel.addRange(range);
					sel.collapseToEnd();
				}
			});
			
			$(doc).on('keypress', function(e) {
				let sel = doc.getSelection();
				if (sel.rangeCount > 1) return;
				
				let range = sel.getRangeAt(0);
				
				//proibir de escrever nas regiões limítrofes de códigos
				if ($(sel.focusNode.parentElement).is("code")) {
					if ((e.charCode && ((!range.startOffset && range.startContainer.textContent[range.startOffset] == "{") || (range.endOffset && range.endContainer.textContent[range.endOffset-1] == "}"))) ||
						(e.key == "{" || e.key == "}")) {
							e.preventDefault();
							return;
						}
				}
				
				if (e.key == "}") {
					if ($(sel.focusNode.parentElement).is("code")) return;
					
					let endNode = sel.focusNode;
					let endOffset = sel.focusOffset;
					
					if (endNode.nodeType == 1) {
						endNode = endNode.childNodes[endOffset];;
						endOffset = 0;
					}

					let startNode = sel.anchorNode;
					let startOffset = sel.anchorOffset;
						
					if (startNode.nodeType == 1) {
						startNode = startNode.childNodes[startOffset];
						startOffset = 0;
					}
					
					let node = startNode;
					
					let text = node.textContent;
					while (!text.match(/{#if\s+|{#else|{#endif|{#\?/i) && (node = node.previousSibling)) text = (node.nodeType==3?node.textContent:node.innerText) + text;
					
					if (node) {
						let m = text.match(/{#(:?if\s+|else|endif|\?)[^}]*$/i);
						if (!m) return;
						let startNode = node;
						let startOffset = m.index;

						if (startNode.nodeType == 1) {
							startNode = startNode.childNodes[startOffset];;
							startOffset = 0;
						}
						let range = doc.createRange();

						range.setStart(startNode, startOffset);
						range.setEnd(endNode, endOffset);
						
						let documentFragment = range.extractContents();
						
						if (documentFragment.lastChild.nodeType == 3) documentFragment.lastChild.nodeValue += "}";
						else documentFragment.lastChild.appendChild(doc.createTextNode("}"));
						
						node = doc.createElement("code");
						node.setAttribute("spellcheck", "false");
						
						node.appendChild(documentFragment);
						range.insertNode(node);
						$(node).mouseenter(highlight_code).mouseleave(unhighlight_code);
						
						sel.removeAllRanges();
						sel.addRange(range);
						sel.collapseToEnd();
						e.preventDefault();
					}
					return;
				}
				
				if (e.key == "{") {
					if ($(range.startContainer.parentElement).is("code")) return;
					
					let startNode = range.startContainer.nodeType==1?range.startContainer.childNodes[range.startOffset]:range.startContainer;
					let startOffset = range.startContainer.nodeType==1?0:range.startOffset;
					let node = startNode;
					let text = startNode.textContent.slice(startOffset);
					let m;
					
					while (!(m = text.match(/^#(?:if\s+|else|endif|\?)[^}]*}/i)) && (node = node.nextSibling)) text += (node.nodeType==3?node.textContent:node.innerText);
					
					if (node && m) {
						let endNode = node;
						let endOffset = node.nodeType==3?node.nodeValue.indexOf("}")+1:node.innerText.indexOf("}")+1;

						let range = doc.createRange();

						range.setStart(startNode, startOffset);
						range.setEnd(endNode, endOffset);
						
						let documentFragment = range.extractContents();
						
						if (documentFragment.firstChild.nodeType == 3) documentFragment.firstChild.nodeValue = "{" + documentFragment.firstChild.nodeValue;
						else documentFragment.firstChild.insertAdjacentElement("afterbegin", doc.createTextNode("{"));
						
						node = doc.createElement("code");
						node.setAttribute("spellcheck", "false");
						
						node.appendChild(documentFragment);
						range.insertNode(node);
						$(node).mouseenter(highlight_code).mouseleave(unhighlight_code);
						
						
						sel.removeAllRanges();
						sel.addRange(range);
						range.setStart(node.firstChild, 1);
						range.collapse(true);
						e.preventDefault();
					}
					return; 
				}
				
			});

			$(doc).on("mousedown", (e) => {$(".cfor_button_list_on").each((index, elem) => {elem.hideList()})});
			
			$(doc).on("mouseup", (e) => {
				if (!btn_cpyfmt.checked()) return;

				let i, sel = doc.getSelection();
				for (i = 0; i < sel.rangeCount; i++) {
					let range = sel.getRangeAt(i);
					
					let td;
					if ($(range.startContainer).is('tr')) {
						td = range.startContainer.childNodes[range.startOffset];
					} else {
						td = range.startContainer.parentElement;
						if (!$(td).is('td') && !(td = $(td).closest('td').get(0))) continue;
					}
					
					let $p;
					if (($p = $(td).children('p')).length) $p.removeAttr('class').addClass(btn_cpyfmt.styleCopied);
					else $(td).each((index, elem) => {
						$(elem).contents().wrapAll(`<p class="${btn_cpyfmt.styleCopied}"></p>`);
					});
				}
				
				sel.removeAllRanges();
				btn_cpyfmt.checked(false);
				
			});
			
		}).catch(error => {errorMessage(error)});
		
		
	}, 100);

  
      
});






 
