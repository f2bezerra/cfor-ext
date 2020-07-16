/***************************************************/
/* Visualização da árvore do processo              */
/* Adiciona detalhes do processo na árvore         */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

//Observador de alterações na árvore
var observer;
 
//Atualização da árvore
if ((html = $('head').html()) && (m = html.match(/controlador\.php\?acao=procedimento_(alterar|consultar)&[^\"]+/))) {
	var url = absoluteUrl(m[0]);
	var is_editable = (m[1].toLowerCase() == "alterar");
	
	$.get(url, function(data) {
		let $html = $(data);
		var processo = {};
		if (!processo.numero) processo.numero = $(".infraArvore > a > span[id^='span']").text().replace(/\D/g, '').substr(0,15);
		processo.tipo = $html.find("#selTipoProcedimento option[selected='selected']").text();
		processo.descricao = $html.find('#txtDescricao').val() || "(Não informado)";

		processo.servico = parseServicoByTipo(processo.tipo);
		if (!processo.servico) processo.servico = parseServicoByText($html.find("#txtDescricao").val());
		if (!processo.servico) processo.servico = {num: "000", desc: "desconhecido"};
		
		if (processo.tipo.match(/cassação/i)) processo.tipo = "Cassação";
		else processo.tipo = processo.tipo.substring(0, processo.tipo.indexOf(":"));
		
		
		var $first = $html.find("#selInteressadosProcedimento option:first");
		processo.interessados = $html.find("#selInteressadosProcedimento option").map(function () { 
			if (!processo.representante && (m = $(this).text().match(/\((\d{3}.?\d{3}.?\d{3}.?\d{2}|[^@]+@[^@]+\.[^)]+)\)\s*$/))) processo.representante = m[1];
			
			return $(this).text().replace(/\(\d[\d.\/-]+\)\s*$/, function(m0){ 
				return "(<span class='actionable'>" + m0.replace(/\D/g,"") + "</span>)";
			}); 
		}).get();
		
		$('#panelDetails').remove();
		
		var divDt =	$("<div id='panelDetails' class='proc-panel div-editable'/>")
					.insertAfter("#frmArvore")
					.append(`<p class="nowrap"><label>Processo: </label><span class='actionable'>${processo.numero}</span></p>`)
					.append(`<p class="nowrap"><label>Tipo: </label><span>${processo.tipo}</span></p>`)
					.append(`<p class="nowrap"><label>Descrição: </label><span>${processo.descricao}</span></p>`)
					.append(`<p class="nowrap"><label>Serviço: </label>${Number(processo.servico.num)?'<span>' + processo.servico.num + " - " + processo.servico.desc + '</span>':'<span style="color:#f00;">000 - Desconhecido</span>'}</p>`);
					
		var obs = $html.find("#txaObservacoes").val();
		var fields = fieldsFromString(obs);
		if (fields) fields.forEach((field) => {divDt.append(`<p class='proc-field' field-name="${identityNormalize(field.name)}"><label>${field.name}: </label><span class='actionable'>${field.value}</span></p>`)});
					
		if (processo.interessados.length > 1) divDt.append(`<p><label>Interessados: </label></p><ul><li>${processo.interessados.join("</li><li>")}</li></ul>`);
		else divDt.append(`<p><label>Interessado: </label>${processo.interessados.toString()}</p>`);
		
		if (Number(processo.servico.num)) divDt.append(`<input type="hidden" id="hdnServico" value="${processo.servico.num}" text="${processo.servico.desc}">`);
		divDt.append(`<input type="hidden" id="hdnTipoProcesso" value="${processo.tipo}">`);
		if ($first.length && (m = $first.text().match(/^\s*(.*?)\(([^)]*?)\)\s*$/i))) divDt.append(`<input type="hidden" id="hdnInteressadoPrincipal" value="${m[2]}" text="${m[1]}">`);
		
		applyActionPanel('.actionable');
		
		updateArvore();

		if (!is_editable) return;
		
		//updateArvore();
		
		var save_fields = function (fields) {
			let consultas = new Promise((resolve, reject) => {
				if (f = findField(fields, "usuario_sei", 0.65))  {
					f.name = "Usuário SEI";
					
					if (f.value == "?") {
						waitMessage("Identificando usuário externo...");
						f.value = "(Não Identificado)";
						
						return getUrlDocumento("Recibo Eletrônico de Protocolo", true).then(recibo => {
							//consultar recibo
							Promise.resolve($.get(absoluteUrl(recibo))).then(data => {
								data = $("<div />").html(data).html();
								if (data && (mu = data.match(/<td\b[^>]*?>\s*Usu[áa]rio\s+Externo[\w\W]*?<td\b[^>]*?>([^<]*?)<\/td>/i))) {
									f.value = mu[1].trim();
									resolve();
								} else reject();
							}).catch(() => {
								reject();
							});
						}).catch(() => {
							//consultar contato externo
							consultarUsuarioExterno(processo.representante).then(data => {
								f.value = (data.status == "ok") ? data.nome : "(Pendente)";
								resolve();
							}).catch(() => {
								reject();
							});
						});
						
					} else reject();
				} else reject();
			});
			
			consultas.finally(() => {

				waitMessage("Atualizando campos...");
				return updateFormSEI(url, "frmProcedimentoCadastro", "btnSalvar", function(doc) {
					$(doc).find("#txaObservacoes").val(fieldsToString(fields, true));
				}).then(() => {
					$(divDt).find('.proc-field').remove();
					let last_p = $(divDt).find('p:contains("Interessado:"):last').get(0) || $(divDt).find('p:contains("Interessados:"):last').get(0) || $(divDt).find('p:last').get(0);
					
					if (fields) fields.forEach((f) => {$(last_p).before($(`<p class="proc-field" field-name="${identityNormalize(f.name)}"><label>${f.name}: </label><span class='actionable'>${f.value}</span></p>`))});
					applyActionPanel('.proc-field span')

					$(divDt).get(0).removeCommand("icon-refresh");

					updateArvore();
					notify("success", "Campos atualizados");
				}).catch(e => notify("fail", "Edição de campos falhou\n" + e.message));
				
			});
			
		};
		
		var save_details = (fields, servico, descricao) => {
			let consultas = new Promise((resolve, reject) => {
				if (f = findField(fields, "usuario_sei", 0.65))  {
					f.name = "Usuário SEI";
					
					if (f.value == "?") {
						waitMessage("Identificando usuário externo...");
						f.value = "(Não Identificado)";
						
						return getUrlDocumento("Recibo Eletrônico de Protocolo", true).then(recibo => {
							//consultar recibo
							Promise.resolve($.get(absoluteUrl(recibo))).then(data => {
								data = $("<div />").html(data).html();
								if (data && (mu = data.match(/<td\b[^>]*?>\s*Usu[áa]rio\s+Externo[\w\W]*?<td\b[^>]*?>([^<]*?)<\/td>/i))) {
									f.value = mu[1].trim();
									resolve();
								} else reject();
							}).catch(() => {
								reject();
							});
						}).catch(() => {
							//consultar contato externo
							consultarUsuarioExterno(processo.representante).then(data => {
								f.value = (data.status == "ok") ? data.nome : "(Pendente)";
								resolve();
							}).catch(() => {
								reject();
							});
						});
						
					} else reject();
				} else reject();
			});
			
			consultas.finally(() => {

				let tipo_changed = false;
				let desc_changed = false;
				
				waitMessage("Salvando detalhes do processo ...");

				return updateFormSEI(url, "frmProcedimentoCadastro", "btnSalvar", function(doc) {
					servico = servico && Number(servico);
					let curr_servico = Number($('#hdnServico').val() || 0);
					//--- selecionar tipologia de acordo com o novo serviço
					if (servico != curr_servico) {
						let tipo_regex = getTipoRegexByServico(servico);
						if (opt = $(doc).find("#selTipoProcedimento option").get().find(item => tipo_regex.test($(item).text()))) {
							$(doc).find('#selTipoProcedimento').val($(opt).val());
							$(doc).find('#hdnIdTipoProcedimento').val($(opt).val());
							$(doc).find('#hdnNomeTipoProcedimento').val($(opt).text());
							
							$('#hdnServico').val(servico).attr("text", getDescServico(servico));
							tipo_changed = true;
						}
					}
					
					if (txt_desc = descricao) {
						if (servico) servico = Number(servico);
						if (servico >= 251 && servico <= 255) txt_desc += " - " + servico;
						$(doc).find("#txtDescricao").val(txt_desc);
						desc_changed = true;
					}

					$(doc).find("#txaObservacoes").val(fieldsToString(fields, true));
				}).then(() => {
					if (desc_changed && (desc = $(divDt).find('p:contains("Descrição:") span').get(0))) $(desc).text(descricao); 
					if (tipo_changed && (serv = $(divDt).find('p:contains("Serviço:") span').get(0))) $(serv).text(servico + " - " + getDescServico(servico)); 
					
					$(divDt).find('.proc-field').remove();
					let last_p = $(divDt).find('p:contains("Interessado:"):last').get(0) || $(divDt).find('p:contains("Interessados:"):last').get(0) || $(divDt).find('p:last').get(0);
					
					if (fields) fields.forEach((f) => {$(last_p).before($(`<p class="proc-field" field-name="${identityNormalize(f.name)}"><label>${f.name}: </label><span class='actionable'>${f.value}</span></p>`))});
					applyActionPanel('.proc-field span')

					$(divDt).get(0).removeCommand("icon-refresh");

					updateArvore();
					notify("success", "Processo atualizado");
				}).catch(e => notify("fail", "Edição de campos falhou\n" + e.message));
				
			});
			
		};		
		
		const CFOR_FIELDS = "Fistel,Entidade,CPF,CNPJ,Fistel Principal,Usuário SEI,Indicativo,Embarcação,COER,Proprietário Anterior";
		
		$(divDt).dropable((data, event) => {
			let default_name = "";
			data = data.replace(/^\s*|\s*$/g, "");
			if ((nr = data.replace(/[./-]/g, "")) && nr.match(/^\d+$/)) {
				if (nr.length == 11) {
					data = nr;
					if (nr.match(/^(?:030|504|801)/)) default_name = "Fistel";
					else default_name = "CPF";
				} if (nr.length == 14) {
					data = nr;
					default_name = "CNPJ";
				} if (nr.length >= 4 && nr.length <= 8) {
					default_name = "Entidade";
				}
				
			} else if (data.match(/^\s*P[A-Z][A-Z0-9]{3,6}\s*$/)) {
				data = data.trim();
				default_name = "Indicativo";
			}
			
			let temp_field = event.ctrlKey;
			
			openFormDlg([{id: "name", type: "text", label: "Nome", value: default_name, items: CFOR_FIELDS.split(","), required: true},
						 {id: "value", type: "text", label: "Valor", value: data, required: false}], "Incluir campo" + (temp_field?" temporário":""), "Salvar", v => {
							if ($(`.proc-field[field-name="${identityNormalize(v.data.name)}"]`).length) {
								v.target = "name";
								v.message = "Nome de campo existente";
								return false;
							}
						 }).then(data => {
							
							if (temp_field) {
								let $f = $(`<p class="proc-field" field-name="${identityNormalize(data.name)}"><span class="temp-field" title="Campo temporário">&nbsp;</span><label>${data.name}: </label><span class='actionable'>${data.value}</span></p>`);
								$(divDt).find('p:last').before($f);
								applyActionPanel($f.find('.actionable'));
								
								$f.find('.temp-field').click(e => {
									$(e.currentTarget).closest('.proc-field').remove();
									if (!$(divDt).find('.temp-field').length) $(divDt).get(0).removeCommand("icon-refresh");
								});
								
								$(divDt).get(0).addCommand("icon-refresh", "Clique para salvar campos temporários", e => {
									let fields = [];
									$(divDt).find('.proc-field').each(function(){fields.push(parseField($(this).text()))});
									save_fields(fields);
								});
								
								return;
							}
							
							waitMessage(`Incluindo campo **${data.name}**...`);
							updateFormSEI(url, "frmProcedimentoCadastro", "btnSalvar", function(doc) {
								let values = $(doc).find("#txaObservacoes").val();
								if (values) values += "\n";
								values += `${data.name}:${data.value};`;
								$(doc).find("#txaObservacoes").val(values);
							}).then(() => {
								let $f = $(`<p class="proc-field" field-name="${identityNormalize(data.name)}"><label>${data.name}: </label><span class='actionable'>${data.value}</span></p>`);
								let last_p = $(divDt).find('p:contains("Interessado:"):last').get(0) || $(divDt).find('p:contains("Interessados:"):last').get(0) || $(divDt).find('p:last').get(0);
								$(last_p).before($f);
								applyActionPanel($f.find('.actionable'));
								notify("success", "Campo atualizado");
							}).catch(e => notify("fail", "Inclusão de campo falhou\n" + e.message));
						 });
		});
		
		$(divDt).editable({	hint: "Clique aqui para editar detalhes do processo",
							callback: function() {
								let div = this, fields = [];
								$(div).find('.proc-field').each(function(){fields.push(parseField($(this).text()))});
								
								let intellisense_options = 	{onlyTokens: false,
								
															 classItem: "cfor-li-intellisense",
								
															 list:	CFOR_FIELDS, 
																	
															 allow: function(e) {
																		if (!e.start) return true;
																		if (last_line = e.target.value.substr(0, e.start).match(/.*$/)) {
																			return !last_line[0].includes(":");
																		} 
																		return true;
																	},
															 
															 onSelect:	function(e) {
																			return `${e.value}: `;
																		}
															};											
								
								
								let curr_serv = $('#hdnServico').val();
								let curr_desc = (desc = $(divDt).find('p:contains("Descrição:") span').get(0)) && $(desc).text().replace(/\(N[aã]o informado\)/i, "");
								
								openFormDlg([{id: "servico", type: "select", label: "Serviço", items: "019,251,252,253,254,255,302,400,507,604", value: curr_serv},
											 {id: "descricao", type: "text", label: "Descrição", value: curr_desc, items: "Pedido Inicial,Nova Autorização de RF,Renúncia,Exclusão,Alteração,Autocadastramento,Mudança de Proprietário,Inclusão de Estação"},
											 {id: "fields", type: "textarea", rows: 7, cols: 50, label: "Campos do processo", value: fieldsToString(fields), intellisense: intellisense_options, autofocus: true}], 
											 "Detalhes do processo", "Salvar").then(data => save_details(fieldsFromString(data.fields), data.servico, data.descricao));
							}
		});
		
	});

	$('body').ready(function() {
		$('#frmArvore').find('[src*=restrito]').filter('[title*="Pendente An"]').attr("src", browser.runtime.getURL(`assets/sei_chave_restrito_pendente.gif`)).closest('a').on("click", function(e) {
			e.preventDefault();
			var $anchor_doc = $('#frmArvore').find("#anchor" + this.id.replace(/[^\d]/g,""));
			var desc = $anchor_doc.text().replace(/\s*\(\d+\)\s*$/,"");
			if (desc && (mdesc = desc.match(/\s*[^\s]+\s*(.*)\s*$/i))) desc = mdesc[1];
			else desc = "";

			let num_serv = Number($('#hdnServico').val()), desc_items = undefined;
			if (!num_serv) {
				num_serv = parseServicoByTipo($(".infraArvore > a > span[id^='span']").attr('title'));
				if (num_serv) num_serv = num_serv.num;
			}
			
			if (num_serv) desc_items = ["do " + getDescServico(num_serv)];
				
			var current_a = this;
			var doc_id = current_a.id.match(/\d+$/);
			if (url_alterar_recebido = (new RegExp(`controlador\\.php\\?acao=documento_alterar_recebido&[^"]+id_documento=${doc_id}[^"]+`, "i")).exec(html)) {
				openFormDlg([{id: "acesso", type: "radio", label: "Informe nível de acesso", items: ["Restrito (Pessoal)", "Público"], vertical: true, value: 0},
							 {id: "desc", type: "text", label: "Descrição do documento", width: 300, autofocus: true, items: desc_items, value: desc},
							 {id: "orienta", type: "check", label: "Opções", text: "Registrar orientação ORLE para restrição", value: localStorage.orientacao_orle != undefined?localStorage.orientacao_orle:true}], 
							 "Alteração", "Confirmar").then(data => {
						
						localStorage.orientacao_orle = data.orienta;	
						
						waitMessage("Atualizando nível de acesso...");
						updateFormSEI(url_alterar_recebido, "frmDocumentoCadastro", "btnSalvar", function (doc) {
							if (data.acesso) {
								if ($optPublico = $(doc).find("#optPublico")) $optPublico.trigger("click");
								else return false;
							} else {
								if ($optRestrito = $(doc).find("#optRestrito")) {
									$optRestrito.prop("checked", true);
									if ($selHipo = $(doc).find("#selHipoteseLegal")) $selHipo.val(34);
									else return false;
									
									if (data.orienta) $(doc).find("#txaObservacoes").val("Por orientação da ORLE, documento de identificação de pessoa física com informação biométrica, endereço de pessoa física e números de CPF ou RG, são informações pessoais, assim como, de acordo com a CGU, data de nascimento, e-mail pessoal e número de telefone fixo/móvel pessoal.");
								} else return false;
							}
							
							if (data.desc != desc) $(doc).find("#txtNumero").val(data.desc);
							
						}).then(()=>{
							if (data.acesso) $(current_a).remove();
							else {
								$(current_a).find("img").attr("src", "imagens/sei_chave_restrito.gif").attr("title", "Acesso Restrito\nInformação Pessoal (Art. 31 da Lei nº 12.527/2011)");
								$(current_a).off("click");
							}
							
							if (data.desc != desc) {
								if (desc) data.desc = $anchor_doc.text().replace(desc, data.desc);
								else if (mdesc = $anchor_doc.text().match(/^\s*([\w\d]+).*(\(\d+\))/)) data.desc = mdesc[1] + " " + data.desc + " " + mdesc[2];
									 else data.desc = $anchor_doc.text();

								$anchor_doc.find('span').text(data.desc).attr("title", data.desc);
							}
							
							notify("success", "Nível de acesso atualizado com sucesso");
						}).catch(() => notify("fail", "Nível de acesso NÃO foi atualizado"));
				});
			}
		});
		
		//Alterar texto de arrasto
		$('a[id^="anchorImg"]').on('dragstart', setDragText);
	});
}

//Atualização das anotações da árvore
if ((html = $('head').html()) && (url_anota = html.match(/controlador\.php\?acao=anotacao_registrar&[^\"]+/))) {
	url_anota = absoluteUrl(url_anota);
	
	$.get(url_anota, function(data) {
		let $html = $(data);
		let $panel = $('#panelNotes');
		
		if (!$panel.length) {
			$panel = $('<div id="panelNotes" class="proc-panel proc-panel-notes"><p><label>Anotações:</label><br><span /></p></div>');
			$("#frmArvore").parent().append($panel);
		}
		
		if (content = $html.find('#txaDescricao').val()) $panel.css('display', 'block').find('span').html(content.replace(/\n/g, "<br>"));
		else $panel.css('display', 'none');
		
		if ($html.find('#chkSinPrioridade').is(':checked')) $panel.addClass("proc-panel-notes-hp");
		
	});
}


//Setar texto de arrasto
function setDragText(e) {
	let id = e.target.id.replace(/\D/g,"");
	let anchor_text = $(`#anchor${id}`).text();
	let sei_text = (m = anchor_text.match(/^\s*(\d{5}\.\d{6}\/\d{4}\-\d{2})|(\d{3,8})\)?\s*$/)) ? m[1] ? "Processo nº " + m[1] : "SEI nº " + m[2] : null;
	let sei_number = sei_text.replace(/[^\d\/\.-]/g,"");

	if (!sei_text) {
		e.preventDefault();
		return;
	};
	
	if (e.originalEvent.ctrlKey) sei_text = sei_number;
	
	e.originalEvent.dataTransfer.clearData();
	e.originalEvent.dataTransfer.setData("text", sei_text);
	e.originalEvent.dataTransfer.setData("sei/link-id", id);
	e.originalEvent.dataTransfer.setData("sei/number", sei_number);
}

//Atualizar árvore anterior à implementação de envio pelos correios pelo SEI
// Mais tarde, será implementada a automatização do procedimento do SEI
function ___updateArvore() {
	
	$('body').ready(function() {
		
		if (observer) {
			observer.disconnect();
			observer = null;
		}
		
		//--- adicionar opções de correios
		if (!getCurrentUsuarioExterno()) {
			const of_regex = /Of[ií]cio\s+\d+\s*\(\d+\)/i;
			
			let $anchorOf = $('#frmArvore').find('[id^=anchorA]').prevUntil('[target=ifrVisualizacao]').prev('[target=ifrVisualizacao]').filter(function() {return $(this).text().match(of_regex)});
			$anchorOf.each(function() {
				let id = this.id.replace(/\D/g,"");
				if (!$('#anchorC' + id).get(0)) {
					let $a = $(`<a id="anchorC${id}" href="javascript:void(0);"><img title="Encaminhar via correio"></a>`);
					$a.find("img").attr("src", browser.runtime.getURL("assets/correios.png"));
					$('#frmArvore').find('#anchorA' + id).after($a);
					$a.click(enviarOficioPelosCorreios)
				}
			});
			
			//--- atualizar pastas fechadas
			var pastas_fechadas = $('#frmArvore [id^=divPASTA]').filter(function() {return $(this).find('a[target=ifrVisualizacao]').length == 0}).get();
			
			if (pastas_fechadas.length) {
				//--- cria uma nova instância de observador
				observer = new MutationObserver(function(mutations) {
					
					mutations.forEach(function(mut) {
						if (mut.addedNodes.length && (node = mut.addedNodes[0])) {
							if ($(node).is('[id^=anchorA]') && (ad = $(node).prevUntil('[target=ifrVisualizacao]').prev().get(0)) && $(ad).text().match(of_regex)) {
								let id = ad.id.replace(/\D/g,"");
								let $a = $(`<a id="anchorC${id}" href="javascript:void(0);"><img title="Encaminhar via correio"></a>`);
								$a.find("img").attr("src", browser.runtime.getURL("assets/correios.png"));
								$(node).after($a);
								$a.click(enviarOficioPelosCorreios);
							}
							
							if ($(node).is('a[id^="anchorImg"]')) $(node).on('dragstart', setDragText);
						}
					});
					
				});
				
				//--- configuração do observador
				var config = {childList: true };
				 
				//--- passar o nó alvo, bem como as opções de observação
				pastas_fechadas.forEach(pasta => {
					observer.observe(pasta, config);
				});
			}
			
		} else $('[src*="correios.png"]').closest('a').remove();
	});
}

//Atualizar árvore
function updateArvore() {
	
	$('body').ready(function() {
		
		if (observer) {
			observer.disconnect();
			observer = null;
		}
		
			
		//--- atualizar pastas fechadas
		var pastas_fechadas = $('#frmArvore [id^=divPASTA]').filter(function() {return $(this).find('a[target=ifrVisualizacao]').length == 0}).get();
		
		if (pastas_fechadas.length) {
			//--- cria uma nova instância de observador
			observer = new MutationObserver(function(mutations) {
				
				mutations.forEach(function(mut) {
					if (mut.addedNodes.length && (node = mut.addedNodes[0])) {
						if ($(node).is('a[id^="anchorImg"]')) $(node).on('dragstart', setDragText);
					}
				});
				
			});
			
			//--- configuração do observador
			var config = {childList: true };
			 
			//--- passar o nó alvo, bem como as opções de observação
			pastas_fechadas.forEach(pasta => {
				observer.observe(pasta, config);
			});
		}
			
	});
}


//Enviar ofício pelo correio
function enviarOficioPelosCorreios(e) {
	alert('Em desenvolvimento');
	return;
	
	let id = e.currentTarget.id.replace(/\D/g,"");
	let ref = $('#anchor' + id).text();
	if (m = ref.match(/^\s*(([^\s]+).*?(\d*))\s*\(?(\d+)\)?\s*$/)) ref = {text: m[1], tipo: filterAccents(m[2], String.prototype.toLowerCase), num: m[3], sei: m[4]};
	
	if (!ref) {
		errorMessage("Não foi possível identificar o ofício");
		return;
	}
	
	confirmMessage(`Encaminhar ${ref.text} via correio?`).then(() => {
		
		waitMessage(`Encaminhando ${ref.text}...`);
		atualizarAndamento(`Solicita-se ao protocolo a expedição do Ofício ${ref.num} (SEI nº ${ref.sei}), por meio de Correspondência Simples Nacional com Aviso de Recebimento.`).then(() => {return enviarProcesso("sede", true, 1)}).then(msg => {
			waitMessage(null);
			window.location.reload();			
			chrome.runtime.sendMessage({action: "notify-success", content: "Encaminhamento concluído com sucesso"});
		}).catch(msg => {
			waitMessage(null);
			chrome.runtime.sendMessage({action: "notify-fail", content: msg});
		});
		
	});
}