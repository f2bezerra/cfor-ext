/***************************************************/
/* Manipulador do visualizador de processos        */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

$('#lnkInfraMenuSistema').attr('href', 'javascript:void();');

document.getElementById("ifrVisualizacao").addEventListener("load", function() {
	var docV = this.contentDocument || this.contentWindow.document;
	var predata = sessionStorage.predata;
	if (predata) {
		predata = JSON.parse(predata);
		delete sessionStorage.predata;
		if (predata.upload) predata.autoconfirm = false;
	} else {
		document.getElementById("ifrVisualizacao").style.visibility = "visible";
		predata = {};
	}

	
	if (frmAnotacao = docV.getElementById("frmAnotacaoCadastro")) {
		var divDados = docV.getElementById("divInfraAreaDados");
		var label = document.createElement("LABEL");
		label.innerText = "Próximo Ponto de Controle (PPC): ";
		frmAnotacao.insertBefore(label, divDados);
		
		var user = "";
		if (m = document.getElementById('lnkUsuarioSistema').getAttribute("title").match(/-\s*(.+)\b\/ANATEL/i)) user = m[1];
		

		var selPPC = document.createElement("SELECT");
		selPPC.className = "infraSelect";
		selPPC.options[selPPC.options.length] = new Option('','');
		selPPC.options[selPPC.options.length] = new Option('Aguardando Pagamento','PPC:Aguardando Pagamento;');
		selPPC.options[selPPC.options.length] = new Option('Em Exigência','PPC:Em Exigência;');
		selPPC.options[selPPC.options.length] = new Option('Autocadastramento','PPC:Autocadastramento;');
		selPPC.options[selPPC.options.length] = new Option('Aguardando Publicação','PPC:Aguardando Publicação;');
		selPPC.options[selPPC.options.length] = new Option('Aguardando manifestação externa','PPC:Aguardando manifestação externa;');
		selPPC.options[selPPC.options.length] = new Option(`Devolver ${user}`,`Devolver ${user}`);
		selPPC.options[selPPC.options.length] = new Option('Concluir','Concluir');
		selPPC.style.marginBottom = "25px";
		
		frmAnotacao.insertBefore(selPPC, divDados);

		var str = docV.getElementById("txaDescricao").value;
		
		if (m = /\n*^\s*(PPC:[^;]*?;|Concluir|Devolver\s+([\w.-_]+))\s*$\n*/im.exec(str)) {
			var key = m[1].toLowerCase();
			var i = Array.prototype.slice.call(selPPC.options).findIndex((opt) => {return opt.value && opt.value.toLowerCase() == key});
			if (i  >= 0) {
				selPPC.selectedIndex = i;
				docV.getElementById("txaDescricao").value = str.substr(0, m.index) + str.slice(m.index + m[0].length);
			}
		}
		
		
		frmAnotacao.addEventListener("submit", function(e) {
			var txa = docV.getElementById("txaDescricao");
			if (selPPC.value) {
				var nv = (selPPC.value == "Concluir")?"":txa.value;

				nv = nv.replace(/\n*^\s*(?:[A-Z]{2,3}:[^;]*?;|Concluir|Devolver\s+[\w.-_]+)\s*$\n*/gim, "");
				
				if (nv && nv.trim()) nv = selPPC.value + "\n" + nv;
				else nv = selPPC.value;
				txa.value = nv;
			}
			
			if (txa) updateNotesPanel(txa.value);
		});

	}
	
	//Inserir tipo de documento externo
	if (predata.tipo && ($selTipo = $(docV).find("#selSerie")) && $selTipo.is(":visible")) {
		if (predata.tipo = $selTipo.find('option').toArray().find((item) => {return $(item).text() == predata.tipo})) predata.tipo = $(predata.tipo).attr("value");
		else predata.tipo = 0;

		$selTipo.val(predata.tipo);
		$(docV).find('#hdnIdSerie').val(predata.tipo);
		
		if (!predata.desc) predata.desc = "from_clipboard"; 
	}
	
	//Inserir descritivo do documento
	if (predata.desc && ($txtDesc = $(docV).find("#txtNumero")) && $txtDesc.is(":visible")) {	
		if (predata.desc === "from_clipboard") navigator.clipboard.readText().then(t => {$txtDesc.val(t)});
		else $txtDesc.val(predata.desc);
	}
	
	//Inserir data de elaboração do documento
	if (dataElab = docV.getElementById("txtDataElaboracao")) {
		if (!$(dataElab).val()) $(dataElab).val((new Date()).toLocaleDateString("pt-BR"));
	}
	
	if (predata.sei) {
		if (($optTB = $(docV).find("#optProtocoloDocumentoTextoBase")) && $optTB.is(":visible")) {
			$optTB.get(0).checked = true;
			$optTB.trigger("click");
			$(docV).find("#txtProtocoloDocumentoTextoBase").val(predata.sei);
		} else predata.autoconfirm = false;
	} else if (($optTP = $(docV).find("#optTextoPadrao")) && $optTP.is(":visible")) {
		$optTP.get(0).checked = true;
		$optTP.trigger("click");
		
		//Inserir código aqui para pré-selecionar texto padrão
		if (predata.txtpad != undefined) {
			$selTxtPad = $(docV).find("#selTextoPadrao");
			if (typeof predata.txtpad != 'number') {
				if (predata.txtpad = $selTxtPad.find('option').toArray().find((item) => {return $(item).text() == predata.txtpad})) predata.txtpad = $(predata.txtpad).attr("value");
				else predata.txtpad = 0;
			}
				
			$selTxtPad.val(predata.txtpad);
		}
	}
	
	if (($optNato = $(docV).find("#optNato")) && $optNato.is(":visible")) {
		$optNato.get(0).checked = true;
		$optNato.trigger("click");
	}
	
	//Adicionar Destinatários
	if ((selDestinatarios = docV.getElementById("selDestinatarios")) && $(selDestinatarios).is(':visible')) {
		if (predata.destinatarios) {
			let arr_dest = []; 
			predata.destinatarios.forEach((item) => {
				selDestinatarios.add(new Option(item.text, item.value));
				arr_dest.push(item.value + "±" + item.text);
			});
			docV.getElementById("hdnDestinatarios").value = arr_dest.join("¥");
		}
		
		if ((interessados = docV.getElementById("hdnInteressados")) && (interessados = interessados.value) && !selDestinatarios.length) {
			interessados = interessados.split("¥").map(function(elem) {return elem.split("±")});
			if (interessados && interessados.length && interessados[0].length == 2) {
				selDestinatarios.add(new Option(interessados[0][1], interessados[0][0]));
				docV.getElementById("hdnDestinatarios").value = interessados[0].join("±");
			}
		}
		
		if (predata.acesso == "auto") {
			for (let dest of selDestinatarios.options) {
				if ($(dest).text().match(/\(\s*(?:[^@\n]+@[\w.\-]+|\d{3}\.?\d{3}\.?\d{3}\-?\d{2})\s*\)\s*$/i)) {
					predata.acesso = 1;
					break;
				} 
			}
		}  		
		
		if (!selDestinatarios.length) predata.autoconfirm = false;
	}
	
	//Adicionar interessados
	if ((selInteressados = docV.getElementById("selInteressados")) && $(selInteressados).is(':visible')) {
	   	if (predata.interessados) {
			let arr_int = []; 
			predata.interessados.forEach((item) => {
				selInteressados.add(new Option(item.text, item.value));
				arr_int.push(item.value + "±" + item.text);
			});
			docV.getElementById("hdnInteressados").value = arr_int.join("¥");
		} 
		
		if ((interessados = docV.getElementById("hdnInteressados")) && (interessados = interessados.value) && !selInteressados.length) {
			interessados = interessados.split("¥").map(function(elem) {return elem.split("±")});
			if (interessados && interessados.length && interessados[0].length == 2) {
				selInteressados.add(new Option(interessados[0][1], interessados[0][0]));
				docV.getElementById("hdnInteressados").value = interessados[0].join("±");
			}
			
		}
		
		if (predata.acesso == "auto") {
			for (let inte of selInteressados.options) {
				if ($(inte).text().match(/\(\s*(?:[^@\n]+@[\w.\-]+|\d{3}\.?\d{3}\.?\d{3}\-?\d{2})\s*\)\s*$/i)) {
					predata.acesso = 1;
					break;
				} 
			}
		}  		

		if (!selInteressados.length) predata.autoconfirm = false;
	}
	
	if ((selAssuntos = docV.getElementById("selAssuntos")) && !selAssuntos.length && (hdnAssuntos = docV.getElementById("hdnAssuntos"))) {

		let ifrA = document.getElementById("ifrArvore");
		let docA = ifrA.contentDocument || ifrA.contentWindow.document;
		let is_rd = false;
		if (inputTipoProcesso = docA.getElementById("hdnTipoProcesso")) is_rd = ($(inputTipoProcesso).val().toLowerCase() == "radiodifusão");
		
		if (is_rd) {
			selAssuntos.add(new Option("280.3 - LICENCIAMENTO DE ESTAÇÕES DE RADIODIFUSÃO", "551"));
			hdnAssuntos.value = "551±280.3 - LICENCIAMENTO DE ESTAÇÕES DE RADIODIFUSÃO";
		} else {
			selAssuntos.add(new Option("203 - INSTRUÇÕES, PROCEDIMENTOS E ROTINAS DE OUTORGA E RECURSOS À PRESTAÇÃO", "472"));
			hdnAssuntos.value = "472±203 - INSTRUÇÕES, PROCEDIMENTOS E ROTINAS DE OUTORGA E RECURSOS À PRESTAÇÃO";
		}
	}
	
	let fn_autoconf = function() {
		if (predata.autoconfirm && ($btnSalvar = $(docV).find("#btnSalvar"))) {
			$btnSalvar.trigger("click");
			document.getElementById("ifrVisualizacao").style.visibility = "visible";
		} 
	};
		
	//Setar referencias
	if (predata.reference && ($txaObs = $(docV).find("#txaObservacoes")) && $txaObs.is(":visible")) {
		let str_ref = referenceToString(predata.reference);
		$txaObs.val(str_ref);
	}
	
	if (($optPublico = $(docV).find("#optPublico")) && $optPublico.is(":visible") && (selHipo = docV.getElementById("selHipoteseLegal"))) {
		$optPublico.on("change", function (e) {
			let obs = $(docV).find("#txaObservacoes").val().replace(/por orien.+\bORLE\b[^.]+\.\n*/ig,"");
			$(docV).find("#txaObservacoes").val(obs);
			$(selHipo).val(0);
		});
	}
	
	
	if (($optRestrito = $(docV).find("#optRestrito")) && $optRestrito.is(":visible") && (selHipo = docV.getElementById("selHipoteseLegal"))) {
		
		$(selHipo).on("change", function (e) {
			let obs = $(docV).find("#txaObservacoes").val().replace(/por orien.+\bORLE\b[^.]+\.\n*/ig,"").replace(/^[\n\r\s]+|[\n\r\s]+$/g, "");
			if (selHipo.value == 34) obs = "Por orientação da ORLE, documento de identificação de pessoa física com informação biométrica, endereço de pessoa física e números de CPF ou RG, são informações pessoais, assim como, de acordo com a CGU, data de nascimento, e-mail pessoal e número de telefone fixo/móvel pessoal." + (obs?"\n\n":"") + obs;
			$(docV).find("#txaObservacoes").val(obs);
		});
		
	
		$optRestrito.on("change", function (e) {
			if (!predata.hipotese) predata.hipotese = 34; //Informação pessoal
			
			var last_len = 0, hs = setInterval(function() {
				if (!selHipo.length) return;
				if ($(selHipo).find(`option[value=${predata.hipotese}]`).length) {
					clearInterval(hs);
					selHipo.value = predata.hipotese;
					$(selHipo).trigger("change");
					
					fn_autoconf();
				} else if (last_len == selHipo.length) {
					clearInterval(hs);
					return;
				}
				last_len = selHipo.length;
			}, 200);
		});
		
		if (predata.acesso != undefined) {
			if (predata.acesso == "auto") predata.acesso = 0;
				
			if (Number(predata.acesso)) $optRestrito.trigger("click");
			else {
				$(docV).find("#optPublico").trigger("click");
				fn_autoconf();
			}
		}
		
	}
	
	//Abrir janela de upload de arquivos automaticamente
	if (predata.upload && ($upfile = $(docV).find('#filArquivo')) && $upfile.is(':visible')) $upfile.trigger('click');
	
	if (predata.autoconfirm || predata.upload) return;

	docV.getElementById("ifrArvoreHtml").addEventListener("load", function() {
		
		//LABORATORIO DE TESTES
		// addCommand("btnLab", "lab.svg", "Teste de Novidades", null, async e => {
			// //let info = getCurrentProcInfo();
			// try {
				// var extrato = await consultarExtrato("80108127907", "$ano >= 2014 && $ano <= 2017");
				// console.log("Extrato:", extrato);
				// infoMessage('Concluído com sucesso');
			// } catch (err) {
				// errorMessage(err);
			// }
			
			// // if (!info.cpfj) {
				// // errorMessage("CPF/CNPJ do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "RA");
				// // return;
			// // }
			
			// // waitMessage("Consultando...");
			// // consultarUrlServico(604, info.cpfj).then(url => chrome.runtime.sendMessage({action: "open", url: [url]})).finally(() => waitMessage(null)).catch(error => errorMessage(error, "Móvel Aeronáutico"));
			// // consultarUsuarioExterno(info.nome);
			
			// // if (!info.cpf) return errorMessage("CPF do interessado não informado.\n\nInforme no próprio cadastro do interessado **ou** inclua um campo CPF no processo.", "PX");
			
			// // autorizarPX(info.cpf, info.processo).then(data => {
				// // waitMessage("Atualizando campos...");
				// // storeFields([{name: "Fistel", value: data.fistel}, {name: "Indicativo", value: data.indicativo}], true).then(html => console.log('ok')).catch(err => console.log(err)).finally(() => waitMessage(null));
			// // });
			// // captureNextProcesso(e);
		// });
		
		
		var doc = this.contentDocument || this.contentWindow.document;

		if (m = /Ofício n. (\d+\/\d{4})/i.exec(doc.body.innerHTML)) {
			if (btnCpag = docV.getElementById("btnCforCpag")) btnCpag.remove();
			
			if (mf = /\bFistel\s+(?:<[^>]*?>|\s)*\d{11}(?:(?:<\/?[^>]*?>|\s)*\s*(?:e|ou|,|e\/ou|&nbsp;|\s)*\d{11})*/i.exec(doc.body.innerHTML)) {
				var ifrA = document.getElementById("ifrArvore");
				var docA = ifrA ? (ifrA.contentDocument || ifrA.contentWindow.document) : null;
				
				if (docA && (ap = docA.querySelector('a[target=ifrVisualizacao]'))) {
					if (mp = /(Outorga|Radiodifus[aã]o)\s*:\s*([^"]*)"[^>]*>([\d.\/-]+)\s*</i.exec(ap.innerHTML)) {
						var nm = /Of[íi]cio n. (?:\d+\/\d{4}).+(?:<\/p>)?[\r\n]*(?:.*(?:&nbsp;<| <)(?:\/p>)?[\r\n]*)*(?:.*Senhor.*(?:\/p>)?[\r\n]*)?.*>(.+)<\/p>/i.exec(doc.body.innerHTML)[1];
						var fs = [];
						
						const regex_fs = /\d{11}/g;
						while (f = regex_fs.exec(mf[0])) {
							if (f.index === regex_fs.lastIndex) regex_fs.lastIndex++;
							fs.push(f[0]);
						}
						fs = fs.join(",");
						
						var docr = (doc.body.textContent===undefined) ? doc.body.innerText : doc.body.textContent;
						
						
						var a = document.createElement('a');
						a.id = "btnCforCpag";
						a.className = "botaoSEI";
						a.href = "javascript:void(0);";
						a.setAttribute("tabindex", "452");
						a.addEventListener("click", function() {
							var debitos = docr.match(/Regularidade\s+fiscal[\w ]+Anatel|constam?\s+d.bitos?/i)?"t":"l";
							var servico;
							if (mp[1] == "Outorga") {
								switch (mp[2].toLowerCase()) {
									case "rádio do cidadão": servico = "400"; break;
									case "radioamador": servico = "302"; break;
									case "slp": servico = "019"; break;
									case "limitado móvel aeronáutico": servico = "507"; break;
									case "limitado móvel marítimo": servico = "604"; break;
									default: 
										switch (true) {
											case /Transmiss[ãa]o\s*de\s*Programas?/i.test(doc.body.innerHTML): servico = "251"; break;
											case /Reportagem\s*Externa/i.test(doc.body.innerHTML): servico = "252"; break;
											case /Ordens\s*Internas?/i.test(doc.body.innerHTML): servico = "253"; break;
											case /para\s*Telecomando/i.test(doc.body.innerHTML): servico = "254"; break;
											case /para\s*Telemedi[cç][ãa]o/i.test(doc.body.innerHTML): servico = "255"; break;
										}
								}
							} 
							
							if (!servico) {
								let ifrA = document.getElementById("ifrArvore");
								let docA = ifrA.contentDocument || ifrA.contentWindow.document;
								if (inputServico = docA.getElementById("hdnServico")) servico = $(inputServico).val();
							}
							
							if (!servico) {
								errorMessage("Serviço indefinido!");
								return;
							}
								
							addControlePagto(fs, mp[3], servico, debitos, nm);
						});
						
						var img = document.createElement("img");
						img.className = "infraCorBarraSistema";
						img.src = browser.runtime.getURL("assets/cpag.png");
						img.title = "Incluir débito no Controle de Pagamentos";
						
						a.appendChild(img);
						docV.getElementById("divArvoreAcoes").appendChild(a);
						
					}
				} 
			}
		}
	}, false);
 }, false);
 
 