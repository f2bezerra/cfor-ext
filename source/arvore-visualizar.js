/***************************************************/
/* Novos recursos de trabalho com processo SEI     */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

(function waitPainelAcoes(t) {
	setTimeout(function () {
		if (t <= 0) return;
		if ($("#divArvoreAcoes").children().length == 0) {
			waitPainelAcoes(t-1);
			return;
		}
		
		addNovo();
		addPPC();
		addBlocoAssinatura();
		
		
		if ($('#divArvoreAcoes a[onclick*="reabrirProcesso()"]').length) {
			addNextProc();
		} else {
			addFuncoesAnatel();
		}
		
		if (anchor_close = $('#divArvoreAcoes a[onclick*="concluirProcesso()"]').get(0)) {
			let safe_close_proc = anchor_close.onclick;
			anchor_close.onclick = function(e) {
				attribProcesso(null).catch(error => notify("fail", error));
				safe_close_proc(e);
			}
		}
		
	}, 20);
})(100);


function addNovo() {
	
	var btn = $('#divArvoreAcoes a[href*="acao=documento_escolher_tipo"]').get(0);

	if (!btn) {
		var html = $(parent.document.getElementById('ifrArvore').contentWindow.document.head).html();
		if (m = html.match(/<a href=["']controlador.php\?acao=documento_escolher_tipo[\w\W]*?<\/a>/i)) {
			btn = $(m[0]).get(0);
			$("#divArvoreAcoes").prepend(btn);
		} else return;
	}
	
	let reference = getCurrentReference();
	
	let items = [{text: "Externo", items: [
						{id: "ext-reg", text: "Consulta de Regularidade"}, 
						{id: "ext-sis", text: "Consulta de Sistema"}, 
						{id: "ext-lic", text: "Licenças Impressas"}, 
						{id: "ext-coer", text: "COER"}, 
						{id: "ext-dec", text: "Declaração de Aeronave"}, 
						{id: "rel-sis", text: "Relatório de Sistema"}, 
						{id: "reg-vis", text: "Registro de Visão"}, 
						{id: "ext-lan", text: "Extrato de Lançamentos"}]}, 
				 "-",
				 {id: "checklist", text: "Lista de Verificação"},
				 {id: "analise", text: "Análise Técnica"},
				 {id: "boletos", text: "Boletos", tip: "Gerar Ofício de Notificação de Boletos"},
				 {id: "licenca", text: "Licença", tip: "Gerar Ofício de Encaminhamento de Licenças", icon: (reference.tipo == "licenca"?"menu-favorite-icon":undefined)},
				 {id: "autocad", text: "Autocadastramento", tip: "Gerar Ofício de Deferimento de Autocadastramento"},
				 {id: "exigencia", text: "Exigência", tip: "Gerar Ofício de Exigência", icon: (reference.tipo == "check"||reference.tipo == "oficio"?"menu-favorite-icon":undefined)},
				 {id: "informe", text: "Informe", tip: "Gerar informe genérico"},
				 {id: "ato", text: "Ato", tip: "Gerar ato genérico"},
				 {id: "certidao", text: "Certidão", tip: "Gerar certidão padrão"},
				 "-",
				 {id: "indeferimento", text: "Indeferimento", tip: "Ofício de Indeferimento", icon: (reference.tipo == "oficio"?"menu-favorite-icon":undefined)},
				 {id: "arquivamento", text: "Arquivamento", tip: "Despacho de Arquivamento"}];
				 
	let url_clonado;			 
	if ($('#divArvoreAcoes a[href*="acao=protocolo_modelo_cadastrar"]').length && (url_clonado = $('#divArvoreAcoes a[href*="acao=documento_alterar"]').attr('href'))) {
		items.unshift({id: "clone", text: "Clonar documento", icon: "menu-copy-icon"}, "-");
	}
	
	if (reference && reference.tipo == "ato") {
		items.splice(items.findIndex((item) => {return item.id == "ato"}) + 1, 0, {id: "extincao", text: "Extinção", tip: "Gerar Ofícios de Notificação de Extinção", icon: "menu-favorite-icon"});
	} 

	createPopupMenu(btn, items, {dropButton: "menu-drop-button", useTip: true, tipText: "Gerar $0"}, function(e) {

		let info = getCurrentProcInfo();
		let url_tipo = absoluteUrl($('#divArvoreAcoes a[href*="acao=documento_escolher_tipo"]').attr("href"));
		reference = getCurrentReference();
	
		$.get(url_tipo, function(data) {
			let url, predata = {}, $html = $(data);
			
			switch (e.id) {
				case "checklist": 
					url = $html.find("[data-desc='check list de analise'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Checklist";
					predata.acesso = 0;
					predata.autoconfirm = true;
					break;

				case "analise": 
					url = $html.find("[data-desc='check list de analise'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Análise_Técnica";
					predata.acesso = 0;
					predata.autoconfirm = true;
					break;
					
				case "boletos": 
					url = $html.find("[data-desc='oficio'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Boletos";
					predata.acesso = "auto";
					predata.autoconfirm = true;
					break;
					
				case "licenca": 
					url = $html.find("[data-desc='oficio'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Licença";
					predata.acesso = "auto";
					if (reference && reference.tipo == "licenca") predata.reference = reference;
					predata.autoconfirm = true;
					break;
					
				case "exigencia": 
					url = $html.find("[data-desc='oficio'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Exigência";
					predata.acesso = "auto";
					if (reference && (reference.tipo == "check" || reference.tipo == "oficio")) predata.reference = reference;
					predata.autoconfirm = true;
					
					break;

				case "autocad": 
					url = $html.find("[data-desc='oficio'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Def_Autocad";
					predata.acesso = "auto";
					predata.autoconfirm = true;
					break;
					
				case "indeferimento": 
					url = $html.find("[data-desc='oficio'] .ancoraOpcao").attr("href");
					predata.txtpad = "O- Indeferimento";
					predata.acesso = "auto";
					if (reference && reference.tipo == "oficio") predata.reference = reference;
					predata.autoconfirm = true;
					
					break;
					
				case "arquivamento": 
					url = $html.find("[data-desc='despacho ordinatorio'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Despacho";
					predata.acesso = 0;
					predata.autoconfirm = true;
					
					break;					
					
				case "extincao": 
					url = $html.find("[data-desc='oficio'] .ancoraOpcao").attr("href");
					predata.txtpad = "O-Notificação_extinção";
					predata.acesso = "auto";
					if (reference && (reference.tipo == "ato")) predata.reference = reference;
					predata.autoconfirm = true;
					
					break;
					
				case "informe": 
					url = $html.find("[data-desc='informe'] .ancoraOpcao").attr("href");
					predata.reference = reference;
					predata.acesso = 0;
					break;

				case "ato": 
					url = $html.find("[data-desc='ato'] .ancoraOpcao").attr("href");
					predata.reference = reference;
					predata.acesso = 0;
					break;
					
				case "certidao": 
					url = $html.find("[data-desc='certidao'] .ancoraOpcao").attr("href");
					predata.txtpad = "O- Certidão";
					predata.acesso = 0;
					predata.autoconfirm = true;
					
					break;					
					
				case "clone":
					if (!reference) return;
					
					$.get(absoluteUrl(url_clonado), (data_clonado) => {
						$html_clonado = $(data_clonado);
						
						let tipo = filterAccents($html_clonado.find('#lblSerieTitulo').text());
						if (!tipo) return;
						
						let interessados = [];
						$html_clonado.find('#selInteressados option').each(function() {interessados.push({text: $(this).text(), value: $(this).val()})});
						
						let destinatarios = [];
						$html_clonado.find('#selDestinatarios option').each(function() {destinatarios.push({text: $(this).text(), value: $(this).val()})});
						
						let acesso = $html_clonado.find('#hdnStaNivelAcessoLocal').val();
						let hipotese = $html_clonado.find('#hdnIdHipoteseLegal').val();
				
						if ((url = $html.find(`[data-desc='${tipo.toLowerCase()}'] .ancoraOpcao`).attr('href')) && (ifr = window.top.document.getElementById("ifrVisualizacao"))) {
							let predata = {sei: reference.sei, acesso: acesso, hipotese: hipotese, autoconfirm: true};
							if (interessados.length) predata.interessados = interessados;
							if (destinatarios.length) predata.destinatarios = destinatarios;
							sessionStorage.predata = JSON.stringify(predata);
							ifr.style.visibility = "hidden";
							ifr.src = url;
						}
					});				
					return;
					
				case "ext-reg":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Consulta";
					predata.desc = "de Regularidade";
					predata.acesso = "auto";
					predata.upload = true;
					break;

				case "ext-sis":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Consulta";
					predata.desc = "de Sistema";
					predata.acesso = "auto";
					predata.upload = true;
					break;
					
				case "ext-lan":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Extrato";
					predata.desc = "de Lançamentos";
					predata.acesso = "auto";
					predata.upload = true;
					break;
					
				case "rel-sis":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Relatório";
					predata.desc = "de Sistema";
					predata.acesso = "auto";
					predata.upload = true;
					break;

				case "reg-vis":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Registro";
					predata.desc = "de Chamado para Suporte de TI";
					predata.acesso = "auto";
					predata.upload = true;
					break;

				case "ext-lic":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Licença";
					if (info && info.indicativo) predata.desc =  info.indicativo;
					predata.acesso = "auto";
					predata.upload = true;
					break;
					
				case "ext-coer":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Certificado";
					predata.desc = "de Operador de Estação de Radioamador";
					predata.acesso = "auto";
					predata.upload = true;
					break;
					
				case "ext-dec":
					url = $html.find("[data-desc*=externo] .ancoraOpcao").attr("href");
					predata.tipo = "Declaração";
					predata.desc = "de Estação de Aeronave" + (info && info.indicativo ? " " + info.indicativo : "");
					predata.acesso = "auto";
					predata.upload = true;
					break;
			}
			
			if (url && (ifr = window.top.document.getElementById("ifrVisualizacao"))) {
				if (e.originalEvent.ctrlKey) {
					chrome.runtime.sendMessage({action: "duplicate", url: url, predata: predata});
				} else {
					sessionStorage.predata = JSON.stringify(predata);
					if (predata.autoconfirm) ifr.style.visibility = "hidden";
					ifr.src = url;
				}
			}
		});
	});
}



function addPPC() {
	
	var btn = $('#divArvoreAcoes a[href*="acao=anotacao_registrar"]').get(0);

	if (!btn) {
		var html = $(parent.document.getElementById('ifrArvore').contentWindow.document.head).html();
		if (m = html.match(/<a href=["']controlador.php\?acao=anotacao_registrar[\w\W]*?<\/a>/i)) {
			btn = $(m[0]).get(0);
			$("#divArvoreAcoes").append(btn);
		} else return;
	}
	
	var user = getCurrentUser();

	createPopupMenu(btn, [{id: "clear", text: "Limpar"}, "-",
						  {id: "ppc:apg", text: "PPC: Aguardando Pagamento"},
						  {id: "ppc:exg", text: "PPC: Em Exigência"},
						  {id: "ppc:acd", text: "PPC: Autocadastramento"},
						  {id: "ppc:apb", text: "PPC: Aguardando Publicação"},
						  {id: "ppc:ame", text: "PPC: Aguardando Manifestação Externa"}, "-",
						  {id: "send", text: "Encaminhar para ... e concluir"}, 
						  {id: "text", text: `Devolver ${user?user.login:""}`},
						  {id: "text", text: "Concluir"}], {dropButton: "menu-drop-button"}, e => {
		let result;
		
		switch (e.id) {
			case "clear":  result = setAnotacao("");  break;
			case "ppc:apg": result = setAnotacao("PPC:Aguardando Pagamento;", "prepend");  break;
			case "ppc:exg": result = setAnotacao("PPC:Em Exigência;", "prepend");  break;
			case "ppc:acd": result = setAnotacao("PPC:Autocadastramento;", "prepend");  break;
			case "ppc:apb": result = setAnotacao("PPC:Aguardando Publicação;", "prepend");  break;
			case "ppc:ame": result = setAnotacao("PPC:Aguardando Manifestação Externa;", "prepend");  break;
			case "send": 
				let unid = "GR01,GR01AF,GR01AT,GR01CO,GR01FI1,GR01FI2,GR01FI3,GR01FI4,GR01GI,GR01OR,GR01P,GR01RC,GR02,GR02AF,GR02AT,GR02CO,GR02FI1,GR02FI2,GR02FI3,GR02GI,GR02OR,GR02RC,GR03,GR03AF,GR03AT,GR03CO,GR03FI1,GR03FI2,GR03GI,GR03OR,GR03P,GR03RC,GR04,GR04AF,GR04AT,GR04CO,GR04FI1,GR04FI2,GR04FI3,GR04GI,GR04OR,GR04P,GR04RC,GR05,GR05AF,GR05AT,GR05CO,GR05FI1,GR05FI2,GR05GI,GR05OR,GR05P,GR05RC,GR06,GR06AF,GR06AT,GR06CO,GR06FI1,GR06FI2,GR06GI,GR06OR,GR06P,GR06RC,GR07,GR07AF,GR07AT,GR07CO,GR07FI1,GR07FI2,GR07GI,GR07OR,GR07P,GR07RC,GR08,GR08AF,GR08AT,GR08CO,GR08FI1,GR08FI2,GR08GI,GR08OR,GR08P,GR08RC,GR09,GR09AF,GR09AT,GR09CO,GR09FI1,GR09FI2,GR09GI,GR09OR,GR09P,GR09RC,GR10,GR10AF,GR10AT,GR10CO,GR10FI1,GR10FI2,GR10GI,GR10OR,GR10P,GR10RC,GR11,GR11AF,GR11AT,GR11CO,GR11FI1,GR11FI2,GR11GI,GR11OR,GR11P,GR11RC,ORCN,ORCN1,ORCN2,ORCN3,ORCN4,ORER,ORER1,ORER2,ORER3,ORER4,ORER5,ORER6,ORER7,ORLE,ORLE1,ORLE2,ORLE3,ORLE4,ORLE5,ORLE6,ORLE7,ORLE8,ORLE9,UO001,UO001FI1,UO001FI2,UO021,UO021FI,UO021O,UO031,UO031FI,UO031OR,UO031P,UO061,UO061FI,UO061P,UO062,UO062FI,UO062P,UO071,UO071FI,UO071P,UO072,UO072FI,UO072OR,UO072P,UO073,UO073FI,UO073P,UO081,UO081FI,UO081P,UO091,UO091FI,UO091P,UO092,UO092FI,UO092P,UO101,UO101FI,UO101P,UO102,UO102FI,UO102P,UO111,UO111FI,UO111P,UO112,UO112FI,UO112P,UO113,UO113FI,UO113P";
				result = openFormDlg([{id: "dest", label: "Destino", type: "text", width: "200px", upper: true, items: unid, required: true}], "Encaminhar para").then(f => setAnotacao(e.text.replace("...", f.dest.toUpperCase()), "prepend"));
				break;
			case "text": result = setAnotacao(e.text);  break;
		}
		
		result.then(data => {
			updateNotesPanel(data.content);
			notify("success", data.msg);
		}).catch(error => notify("fail", error));
	});							  
	
}


//Adicionar opções na opção de encaminhamento 
function addBlocoAssinatura() {
	var btn = $('#divArvoreAcoes a[href*="acao=bloco_escolher"]').get(0);
	if (!btn) return;
	
	var reference = getCurrentReference();
	if (!reference) return;
	
	let msg_success = `Documento "${reference.name}" INCLUÍDO com sucesso`;

	createPopupMenu(btn, [{id: "encaminhar", text: "Encaminhar para assinatura", icon: "menu-send-icon"},"-",{id: "marcar", text: "Marcar como Encaminhado para assinatura", icon: "extension://assets/flag.svg"}], {dropButton: "menu-drop-button"}, e => {
		
		if (e.id == "marcar") {
			setPontoControle("assinatura").then(msg => notify("success", "Marcado ponto de controle com SUCESSO!")).catch(error => notify("fail", error));
			return;
		}
		
 		new Promise((resolve, reject) => {
			waitMessage(`Incluindo documento **${reference.name}** no bloco de assinatura...`);
			
			let url = $(btn).attr('href');

			//abertura da página de seleção do bloco
			getSEI(url).then(data => {
				let $data = $(data);
				
				let expr_bloco, desc_bloco, disp_bloco, anota_bloco, hoje = new Date().toLocaleDateString("pt-BR");
				
				switch (reference.tipo) {
					case "oficio": 
						expr_bloco = "of[ií]cios?"; 
						desc_bloco = "Ofícios " + hoje;

						let f_user = getCurrentFields("usuario_sei");
						anota_bloco = f_user && f_user.value &&  !f_user.value.match(/\b(?:pendente|n[aã]o\s*informado|n[aã]o\s*identificado)\b/i) ? f_user.value : null;

						break;

					case "ato": 
					case "informe": 
						expr_bloco = "atos?\\s+e\\s+informes?"; 
						desc_bloco = "Atos e Informes " + hoje;
						disp_bloco = "gr05";
						break;
						
					case "despacho": 
					case "memorando": 
						expr_bloco = "despachos?\\s+e\\s+memorandos?"; 
						desc_bloco = "Despachos e Memorandos " + hoje;
						break;
				}
				
				if (!expr_bloco) {
					reject(`Tipologia "${reference.tipo}" não tratada`);
					return;
				}
				
				//selecionar ou criar bloco de assinatura
				return new Promise((resolve, reject) => {
					if ((blocos = $data.find('#selBloco option').get()) && blocos.length) {
						expr_bloco = "^\\s*\\d+\\s*-\\s*" + expr_bloco + ".*" + hoje;
						let regex = new RegExp(expr_bloco, "i");
						if (bloco = blocos.find(b => {return regex.test($(b).text())})) {
							bloco = {value: $(bloco).val(), text: $(bloco).text()};
							
							resolve(bloco);
							return;
						} 
					}
					
					let url_criar_bloco;
					
					if (!(url_criar_bloco = data.match(/controlador\.php\?acao=bloco_assinatura_cadastrar[^'"]+/i))) {
						reject("URL para novo bloco não encontrada");
						return;
					}

					postSEI(url_criar_bloco[0], e => {
						e.data.txtDescricao = desc_bloco;
						
						if (disp_bloco && (m = e.html.match(/AutoCompletarUnidade\s*=\s*new\s*infraAjaxAutoCompletar\(.*?(controlador_ajax\.php\?acao_ajax=unidade_auto_completar_outras[^'"]+)/i))) {
							unid = syncAjaxRequest(absoluteUrl(m[1]), "post", "palavras_pesquisa=" + disp_bloco);
							if (!unid || !unid.ok) return Promise.reject(`Não foi possível consultar unidade "${disp_bloco}"`);
							
							let elem = unid.response.documentElement ? unid.response.documentElement.firstChild : null;
							let regex_unid = new RegExp(`^${disp_bloco}\\b`, "i");
							disp_bloco = null;
							while (elem) {
								if (regex_unid.test(elem.getAttribute("descricao"))) {
									disp_bloco = {id: elem.getAttribute("id"), desc: elem.getAttribute("descricao")};
									break;
								}
								elem.nextSibling();
							}
							
							if (!disp_bloco) return Promise.reject(`Unidade "${disp_bloco}" não encontrada`);
							
							e.data.selUnidades = disp_bloco.id;
							e.data.hdnUnidades = disp_bloco.id + "±" + disp_bloco.desc;
						}						
						
					}).then(html => {
						let $bloco_novo = $(html);
						
						if (bn = $bloco_novo.find('#selBloco option:selected').get(0)) resolve({value: $(bn).val(), text: $(bn).text()});
						else reject(`Falha na criação do bloco "${desc_bloco}"`);
						
					}, reject);
					
				}).then(bloco => {
					//incluir documento no bloco de assinatura
					postSEI($data.find('#frmBlocoEscolher'), {selBloco: bloco.value}).then(html => {
						let row =  $(html).find(`td:nth-child(2):contains(${reference.sei})~td:last-child:contains(${bloco.value})`).closest('tr').get(0)
						
						if (!row) {
							reject(`Falha na inclusão do documento no bloco "${bloco.text}"`);
							return;
						}
						
						let comentario;
						
						if (anota_bloco) {
							let url_lista = (h = $(top.window.document.body).html()) && (m = h.match(/controlador\.php\?acao=bloco_assinatura_listar&[^"']+/i)) ? m[0].replace(/&amp;/g, "&") : null;
							
							comentario = getSEI(url_lista).then(html => {
								let url_bloco =  $(html).find(`td:nth-child(2):contains(${bloco.value}) a`).attr("href");

								if (!url_bloco) return Promise.reject(`Falha na listagem de blocos de assinatura`);
								
								return getSEI(url_bloco).then(html => {
									let url_alterar =  $(html).find(`td:nth-child(4):contains(${reference.sei})~td:last-child a[onclick*="acao=rel_bloco_protocolo_alterar&"]`).attr("onclick");
									
									if (!url_alterar) Promise.reject(`Falha na alteração dos comentários no bloco de assinatura`);
									
									url_alterar = url_alterar.match(/controlador\.php\?acao[^'"]+/i)[0];
									return postSEI(url_alterar, {txtAnotacao: anota_bloco}).then(() => {return Promise.resolve(true)});									
								});
								
							});
						} else comentario = Promise.resolve(true);
						
						let ponto_controle	= setPontoControle("assinatura");
						
						Promise.all([comentario, ponto_controle]).then(() => {resolve(msg_success)}, reject);
						
					}, () => {reject(`Falha na inclusão do documento no bloco "${bloco.text}"`)});					
				}, () => {reject(`Falha na seleção/criação do bloco "${bloco.text}"`)});
				
			}).catch(error => {
				reject("Falha de carregamento da página de seleção de bloco");
			});
			
		}).then(msg => {
			waitMessage(null);
			chrome.runtime.sendMessage({action: "notify-success", content: msg});
		}).catch(msg => {
			waitMessage(null);
			chrome.runtime.sendMessage({action: "notify-fail", content: msg});
		}); 
		
	});							  
	
}


function addNextProc() {
	addCommand("btnGetNext", "next-proc.png", "Analisar próximo processo", null, captureNextProcesso);
}


function addFuncoesAnatel() {
	let servico = (info = getCurrentProcInfo()) && info.codServico;

	if (!servico) return;
	
	console.log("serviço: ", servico);
	
	//let items = []; //[{text: "Créditos", items: [{id: "lancto", text: "Lançar Créditos Retroativos", icon: "menu-money-icon"}]}];
	let items = [{id: "cons_ent", text: "Consultar Entidade", icon: "menu-search-icon"}];
	
	switch (servico) {
		case 302:
			items.push("-", {text: "Radioamador", items: [{id: "ra_cons", text: "Consultar Serviço", icon: "extension://assets/consulta.svg"}, "-",
														  {id: "ra_pi", text: "Incluir Serviço e Estação", icon: "extension://assets/pxra.svg"}]});
			break;
		case 400:
			items.push("-", {text: "PX", items: [{id: "px_cons", text: "Consultar Serviço", icon: "extension://assets/consulta.svg"}, "-",
												 {id: "px_pi", text: "Incluir Serviço e Estação", icon: "extension://assets/pxra.svg"}]});
			break;

		case 507:
			items.push("-", {text: "Móvel Aeronáutico", items: [{id: "ma_cons", text: "Consultar Serviço", icon: "extension://assets/consulta.svg"}]});
			break;
			
		case 604:
			items.push("-", {text: "Móvel Marítimo", items: [{id: "mm_cons", text: "Consultar Serviço", icon: "extension://assets/consulta.svg"}]});
			break;
	}
	
	if (items.length == 1 && items[0].items) items = items[0].items;
	
	addCommand("btnAnatel", "anatel.svg", "Executar ações de Outorga", items, e => {
		let info = getCurrentProcInfo();
		
		switch (e.id) {
			case "lancto": return lancarCreditosRetroativos(info.processo, info.codServico, info.fistel);
			
			case "cons_ent": {
				let cpfj = info.cpf || info.cnpj;

				if (!cpfj) {
					errorMessage("CPF ou CNPJ do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF ou CNPJ no processo.", "Consulta");
					return;
				}
				
				waitMessage(`Consultando ${info.cpf?"CPF":"CNPJ"} nº **${cpfjReadable(cpfj)}**...`);
				consultarEntidade(cpfj).then(cadastro => {
					waitMessage(null);
					let msg = `@@**Entidade:** ${cadastro.nome.toUpperCase()}\n`;
					
					if (info.cpf) msg += `**CPF:** ${cpfjReadable(cpfj)}\n**Identidade:** ${cadastro.rg}/${cadastro.expedidor}\n**Data de Nascimento:** ${cadastro.nascimento}\n`;
					else msg += `**CNPJ:** ${cpfjReadable(cpfj)}\n`;
					
					msg += `**E-Mail:** ${cadastro.email?cadastro.email:""}\n**Endereço${info.cnpj?" Sede":""}:** ${cadastro.logradouro}${cadastro.num?", " + cadastro.num:""}${cadastro.complemento?", "+cadastro.complemento:""}${cadastro.bairro?", "+cadastro.bairro:""}\n` +
 						   `**Município:** ${cadastro.municipio}/${cadastro.uf}\n**CEP:** ${cadastro.cep}@@`;
					popupMessage(msg, "Consulta");
					
				}).catch(error => {
					waitMessage(null);
					errorMessage(error, "Consulta")
				});			
			}
			break;
			
			case "px_cons": {
					if (!info.cpf) {
						errorMessage("CPF do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "PX");
						return;
					}
					
					waitMessage("Consultando PX...");
					consultarUrlServico(400, info.cpf).then(url => chrome.runtime.sendMessage({action: "open", url: [url]})).finally(() => waitMessage(null)).catch(error => errorMessage(error, "PX"));
			}
			break;
			
			case "px_pi":
				if (!info.cpf) {
					errorMessage("CPF do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "PX");
					return;
				}
				
				autorizarPX(info.cpf, info.processo).then(data => {
					waitMessage("Atualizando campos...");
					storeFields([{name: "Fistel", value: data.fistel}, {name: "Indicativo", value: data.indicativo}], true).then(fields => refreshFields(fields)).catch(err => console.log(err)).finally(() => waitMessage(null));
				});	
				break;
				
			case "ra_pi":
				if (!info.cpf) return errorMessage("CPF do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "Radioamador");
				
				autorizarRA(info.cpf, info.processo).then(data => {
					waitMessage("Atualizando campos...");
					storeFields([{name: "Fistel", value: data.fistel}, {name: "Indicativo", value: data.indicativo}], true).then(fields => refreshFields(fields)).catch(err => console.log(err)).finally(() => waitMessage(null));
				});	
				break;
				
			case "ra_cons": {
					if (!info.cpf) {
						errorMessage("CPF do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "RA");
						return;
					}
					
					waitMessage("Consultando RA...");
					consultarUrlServico(302, info.cpf).then(url => chrome.runtime.sendMessage({action: "open", url: [url]})).finally(() => waitMessage(null)).catch(error => errorMessage(error, "RA"));
			}
			break;

			case "ma_cons": {
					if (!info.cpfj) {
						errorMessage("CPF/CNPJ do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "Móvel Aeronáutico");
						return;
					}
					
					waitMessage("Consultando Móvel Aeronáutico...");
					consultarUrlServico(507, info.cpfj).then(url => chrome.runtime.sendMessage({action: "open", url: [url]})).finally(() => waitMessage(null)).catch(error => errorMessage(error, "Móvel Aeronáutico"));
			}
			break;

			case "mm_cons": {
					if (!info.cpfj) {
						errorMessage("CPF/CNPJ do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "Móvel Marítimo");
						return;
					}
					
					waitMessage("Consultando Móvel Marítimo...");
					consultarUrlServico(604, info.cpfj).then(url => chrome.runtime.sendMessage({action: "open", url: [url]})).finally(() => waitMessage(null)).catch(error => errorMessage(error, "Móvel Marítimo"));
			}
			break;
			
		}
		
	});

}