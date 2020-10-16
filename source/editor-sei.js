//Ajustar documento antes do salvamento
var script_beforesave = document.createElement('script');
script_beforesave.textContent = `var hsbs = setInterval(function() {
	for (inst in CKEDITOR.instances) if (CKEDITOR.instances[inst].status != "ready") return;
	clearInterval(hsbs);
	
	for (inst in CKEDITOR.instances) {
		var editor = CKEDITOR.instances[inst];
		editor.on("save", (evt) => {
			var html = evt.editor.document.$.body.innerHTML;
			html = html.replace(/<span\\b[^>]*?style=["']background-color:[^>]+>([\\w\\W]*?)<\\/span>/gi, '$1');
			evt.editor.document.$.body.innerHTML = html;
		});
	}
}, 400);`;
(document.body||document.documentElement).appendChild(script_beforesave);

//Localizar editor com o documento automatizável
var editor, alt_editor, html, tipo_doc;
$("#frmEditor [name^='txaEditor_']").each((i, ed) => {
	if (editor) return false;
	html = $(ed).val();
	if (html.match(/<p[^>]*>%INIT\([\w\W]*?\)%(?:%FIELDS\([\w\W]*?\)%)?(?:%REFS\([\w\W]*?\)%)?<\/p>/i)) editor = ed;
	if (!editor && html.match(/@tratamento_destinatario@|o\s*gerente\s*regional\s*da\s*anatel(?:<\/[^>]*?>)?\s*,/i)) alt_editor = ed;
	if (i == 1 && html.match(/\bAto\s+n[^\s]+\s+\d+/i)) tipo_doc = "ato";
});

//Seleção alternativa do editor
if (!editor) {
	if (alt_editor) editor = alt_editor;
	else if (tipo_doc == "ato")	editor = $("#frmEditor [name^='txaEditor_']").get(2);
}

//Executar automação do documento
if (editor) {
	html = $(editor).val();
	var m, esp_proc, desc_servico, ind_servico, cod_servico, sigla_servico, cpfj_dest, cpfj_int, fields, references, usu_sei_ok;
	
	//---inicialização das variáveis internas ===> %INIT(@tipo_processo@;@especificacao_processo@;@cpf_interessado@;@cnpj_interessado@;@cpf_destinatario@;@cnpj_destinatario@)%
	html = html.replace(/<p[^>]*>%INIT\(([^,]*?),(.*?),\s*([\d\.\-]+|@[\w_]+@|)\s*,\s*([\d\.\-\/]+|@[\w_]+@|)\s*,\s*([\d\.\-]+|@[\w_]+@|)\s*,\s*([\d\.\-\/]+|@[\w_]+@|)\s*\)%(?:%FIELDS\(([\w\W]*?)\)%)?(?:%REFS\(([\w\W]*?)\)%)?<\/p>/i, (m0, m1, m2, m3, m4, m5, m6, m7, m8) => {
		var set_servico = function(cod) {
			cod_servico = ("000" + cod).slice(-3); 
			switch (parseInt(cod)) {
				case 19: 
					desc_servico = "Serviço Limitado Privado"; 
					ind_servico = "Limitado Privado"; 
					sigla_servico = "SLP";
					break;

				case 251:
					desc_servico = "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Ligação para Transmissão de Programas"; 
					ind_servico = "SARC(251)"; 
					sigla_servico = "SARC";
					break;

				case 252:
					desc_servico = "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Reportagem Externa"; 
					ind_servico = "SARC(252)"; 
					sigla_servico = "SARC";
					break;
					
				case 253:
					desc_servico = "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Comunicação de Ordens Internas"; 
					ind_servico = "SARC(253)"; 
					sigla_servico = "SARC";
					break;
					
				case 254:
					desc_servico = "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Telecomando"; 
					ind_servico = "SARC(254)"; 
					sigla_servico = "SARC";
					break;
					
				case 255:
					desc_servico = "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Telemedição"; 
					ind_servico = "SARC(255)"; 
					sigla_servico = "SARC";
					break;
					
				case 302: 
					desc_servico = "Serviço de Radioamador"; 
					ind_servico = "Radioamador"; 
					sigla_servico = "RA";
					break;

				case 400: 
					desc_servico = "Serviço Rádio do Cidadão"; 
					ind_servico = "Rádio do Cidadão"; 
					sigla_servico = "PX";
					break;

				case 507: 
					desc_servico = "Serviço Limitado Móvel Aeronáutico"; 
					ind_servico = "Limitado Móvel Aeronáutico"; 
					sigla_servico = "SLMA";
					break;

				case 604: 
					desc_servico = "Serviço Limitado Móvel Marítimo"; 
					ind_servico = "Limitado Móvel Marítimo"; 
					sigla_servico = "SLMM";
					break;
			}
		}
		
		let $area = $('<textarea />');
		
		m1 = $area.html(m1).text().trim().toLowerCase();
		switch (m1) {
			case "outorga: rádio do cidadão": set_servico(400); break;
			case "outorga: radioamador": set_servico(302); break;
			case "outorga: slp": set_servico(19); break; 
			case "outorga: limitado móvel aeronáutico": set_servico(507); break; 
			case "outorga: limitado móvel marítimo": set_servico(604); break; 
			default:
				if (m2) {
					m2 = $('<textarea />').html(m2).text();
					switch (true) {
						case /\bLTP\b|\b251\b|Transmiss.o\s+de\s+Programas?/i.test(m2): set_servico(251); break; 
						case /\bRE\b|\b252\b|Reportagem\s+Externa/i.test(m2): set_servico(252); break; 
						case /\bOI\b|\b253\b|Ordens\s+Internas?/i.test(m2): set_servico(253); break; 
						case /\bTC\b|\b254\b|Telecomando/i.test(m2): set_servico(254); break; 
						case /\bTM\b|\b255\b|Telemedi..o/i.test(m2): set_servico(255); break;
						default:
							if (m = m2.match(/\b(?:0?19|302|400|507|604)\b/)) set_servico(m[0]);
					}
				}
		}
		
		var cpfj_regex = /[\d\.-\/]+/;
		cpfj_int = cpfj_regex.test(m3)?m3:cpfj_regex.test(m4)?m4:undefined;
		cpfj_dest = cpfj_regex.test(m5)?m5:cpfj_regex.test(m6)?m6:undefined;
		
		esp_proc = m2;
		
		if (m7) fields = fieldsFromString($area.html(m7).text());
		if (m8) references = referencesFromString($area.html(m8).text());
		
		if (!cpfj_int && (c = findFieldValue(fields, "cpf", "num") || findFieldValue(fields, "cnpj", "num")) && validateCpfj(c)) cpfj_int = c;

		return "";
	});

	//Função de escrita de texto destacado
	var HLText = (text, color="red") => `<span style="background-color:${color};">${text}</span>`;

	//--- INTERPRETAÇÃO DOS CAMPOS

	//intepretar campos %desc_servico%, %ind_servico%, %cod_servico% e %sigla_servico%
	html = html.replace(/%(desc|ind|cod|sigla)_servico(?:@([^%]+))?%/ig, (m0, prefix, format) => {
		var value;
		switch (prefix.toLowerCase()) {
			case "desc": value = desc_servico == undefined?HLText("*** Serviço Desconhecido ***"):desc_servico; break;
			case "ind": value = ind_servico == undefined?HLText("*** Desconhecido ***"):ind_servico; break;
			case "cod": value = cod_servico == undefined?'000':cod_servico; break;
			case "sigla": value = sigla_servico == undefined?'':sigla_servico; break;
		}
		
		return formatValue(value, format);
	});
	
	//função interna para determinar se é pessoa física ou jurídica
	let is_pfj = c => {
		if (!c) return false;
		c = c.replace(/\D/g, "");
		return c.length == 11 ? "f" : c.length == 14 ? "j" : undefined;
	}

	//interpretar campos %desc_cpfj_int%, %cpfj_int%, %desc_cpfj_dest%, %cpfj_dest%
	html = html.replace(/%(desc_)?cpfj_(int|dest)(?:@?(\*))?%/ig, (m0, prefix, sufix, format = "") => {
		let value;
		
		if (sufix.toLowerCase() == "int") {
			if (!cpfj_int) return HLText("*** CPF/CNPJ do Interessado Desconhecido ***");
			value = cpfj_int;
		} else {
			if (!cpfj_dest) return HLText("*** CPF/CNPJ do Destinatário é Desconhecido ***");
			value = cpfj_dest;
		}
		
		value = format.includes("num")?value.replace(/\D/g,""):value;
		
		if (is_pfj(cpfj_int) == "f") {
			if (format.includes("*")) value = "***" + value.slice(3,-2) + "**"
			if (prefix) value = "CPF nº " + value;
		} else {
			if (prefix) value = "CNPJ nº " + value;
		}
		if (format.includes("low")) value = value.toLowerCase();
		
		return value;
	});

	//interpretar campos %is_int_pf%, %is_int_pj%, %is_dest_pf% e %is_dest_pj%
	html = html.replace(/%is_(dest|int)_p(f|j)%/ig, (m0, m1, m2) => {
		if (m1.toLowerCase() == "dest") {
			if (m2.toLowerCase() == "f") return is_pfj(cpfj_dest) == "f" ? "1" : "0";
			else return is_pfj(cpfj_dest) == "j" ? "1" : "0";
		} else {
			if (m2.toLowerCase() == "f") return is_pfj(cpfj_int) == "f" ? "1" : "0";
			else return is_pfj(cpfj_int) == "j" ? "1" : "0";
		}
	});

	//interpretar campos %is_sarc%
	html = html.replace(/%is_sarc%/ig, (m0) => {
		var n = cod_servico == undefined ? 0 : parseInt(cod_servico);
		return !n ? HLText("???") : n > 250 && n < 256 ? "1" : "0";
	});
	
	//interpretar campos %usu_sei_ok%
	html = html.replace(/%usu_sei_ok%/ig, (m0) => {
		if (usu_sei_ok == undefined) usu_sei_ok = getCurrentUsuarioExterno(fields)?"1":"0";
		return usu_sei_ok;
	});
	
	
	//---Variáveis definidas pelo usuário
	var uservars = {hoje: (new Date()).toDateBR()};
	if (fields) fields.forEach(f => uservars[identityNormalize(f.name)] = f.value);
	
	//---Função para substituição das variáveis definidas pelo usuário
	var replace_uservars = html => {
		if (!html) return html;
		return html.replace(/(?:\$(\w[\w_]*)(?:@(-?\d+(?:,-?\d+)?|[\w\*]+))?)(?!\w*\s*=)/g, (m0, name, format) => {
			if (!uservars.hasOwnProperty(name)) return "";
			return formatValue(uservars[name], format);
		});
	}

	//--- INTERPRETAÇÃO DAS FUNÇÕES
	
	//interpretar funções %ep_has(expr)%
	html = html.replace(/%ep_has\(\s*([^)]+)\s*\)%/ig, (m0, expr) => {
		expr = expr.replace(/\*/g, ".*").replace(/\?/g, ".").replace(/\"/g, "\b").replace(/&nbsp;/g, " ").replace(/<(\w+)[^>]*>(.+)<\/\1>/gi, "$2");
		
		return (new RegExp(expr, "i")).test(esp_proc) ? "1" : "0";
	});
	
	//interpretar funções %field(name, format, default)%
	html = html.replace(/%field\(\s*([^;)@]+)(?:\s*@([^;)]+))?\s*(?:;\s*([^)]+)\s*)?\)%/ig, (m0, name, format, _default) => {
		return (f = findFieldValue(fields, name, 0.9, format)) ? f : _default ? replace_uservars(_default) : "";
	});
	
	//interpretar funções %ref(name, format, default)%
	html = html.replace(/%ref\(\s*([^;@)]+)(?:@([^;)]+))?(?:\s*;\s*([^)]*)\s*)\)%/ig, (m0, name, format, _default) => {
		if (!references) return "";
		
		let ref_name = identityNormalize(name);
		let value = references[ref_name];
		
		if (format && value) {
			format = format.toLowerCase().trim();
			switch (name) {
				case "sei": 
					if (format == "link") value = `<span data-cke-linksei="1" style="text-indent:0px;" contenteditable="false"><a id="lnkSei${references.protocolo}" class="ancoraSei" style="text-indent:0px;">${value}</a></span>`;
					break;

				case "ano":
					if (format == "2") value = (value.length == 4) ? value.slice(-2) : value.substr(0,2);
					else if (format == "4") value = (value.length == 4) ? value : (Number(value.slice(-2))<50?"20":"19") + value.slice(-2);
					break;
				
				case "data":
					if (format == "ext" && (md = value.match(/(\d{2})\/(\d{2})\/(\d{4})/))) {
						let mes = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
						value = `${Number(md[1])} de ${mes[Number(md[2])-1]} de ${md[3]}`;
					}
					break;
					
				default:
					value = formatValue(value, format);				
			}
		}
		
		return value ? value : _default ? replace_uservars(_default) : "";
	});

	//substituir atributos bookmark por bm
	html = html.replace(/\bbookmark\s*?(=\s*?\\?["'][^"']*?\\?["'])/ig, (m0,m1) => {
		return "bm" + m1;
	});
	
	//interpretar funções %bm(name)%
	html = html.replace(/%bm\(\s*([^)]+)\s*\)%/ig, (m0, name) => {
		if (!references || !references.bookmarks) return "";
		name = identityNormalize(name);
		let value = references.bookmarks[bm_name];
		return value ? value : "";
	});
	
	
	//--- OUTROS TRATAMENTOS
	
	//tratar escapes de caracters
	html = html.replace(/&#(\d+);/g, (m0, code) => {
		return String.fromCharCode(parseInt(code));
	});	
	
	//incluir forma de tratamento de destinatário quando não definido
	html = html.replace(/@tratamento_destinatario@/gi, (m0) => {
		if (is_pfj(cpfj_dest) == "f") return HLText("Ao(À) Senhor(a)");
		return HLText("Ao(À) Senhor(a) Representante Legal de");
	});
	
	//apagar complemento de endereço quando não definido
	html = html.replace(/\s*(?:<(\w+)\b[^>]*?>)?\s*[,-]?(?:\s|&nbsp;)*@complemento_endereco_destinatario@\s*(?:.*?<\/\1>)?/gi, (m0) => {
		return "";
	});
	
	//corrigir automaticamente denominação do cargo de gerência
	html = html.replace(/O GERENTE REGIONAL DA ANATEL\s*(?=(?:<\/[^>]+>)?\s*,)/g, (m0) => {
		return HLText("O GERENTE REGIONAL DA ANATEL NO ESTADO DO RIO GRANDE DO SUL", "yellow");
	});
	
	//inserir Portaria 889 (Delegação) nos atos quando não existir
	if (tipo_doc == "ato" && !html.match(/\bPortaria\s*?n\.?(?:\s|&\w+;)*?889\b/i)) {
		let portaria = HLText(`CONSIDERANDO o disposto na <a data-cke-saved-href="http://www.anatel.gov.br/legislacao/portarias-de-delegacao/645-portaria-889" href="http://www.anatel.gov.br/legislacao/portarias-de-delegacao/645-portaria-889" target="_blank">
		Portaria n.º&nbsp;889, de 07 de novembro de 2013</a>, que delega competências às Gerências Regionais para aprovação, expedição, adaptação, prorrogação e extinção, exceto por caducidade, de autorização para exploração de serviços de telecomunicações, e de uso de radiofrequências decorrentes, em regime privado de interesse restrito;`, "yellow");
		
		html = html.replace(/[\w\W]*?(<p[^>]*?>)(?=(?:\s*?<\w[^>]*?>)?\s*?CONSIDERANDO)/i, `$&${portaria}</p>$1`);
	}
	
	//--- FUNÇÕES DE AUTOMATIZAÇÃO
	
	//---Função para aplicação dos testes de condicionamento
	var apply_conditions = (html, defer_vars) => {
		
		let regex_undef = defer_vars ? /%\w+\(.*\)%|\$\w[\w_]*\b/i : /%\w+\(.*\)%/i;
		let block_regex =  /(<p[^>]*?><code[^>]*?>{#if\s*([^}]*?)}<\/code><\/p>([\w\W]*?)?)(<p[^>]*?><code[^>]*?>{#if\s*[^}]*?}<\/code><\/p>[\w\W]*?)?(?:<p[^>]*?><code[^>]*?>{#else}<\/code><\/p>([\w\W]*?))?<p[^>]*?><code[^>]*?>{#endif}<\/code><\/p>/ig;
		let inline_regex = /(<code[^>]*?>{#if\s*([^}]*?)}<\/code>(?!<\/p>)([\w\W]*?)?)(<code[^>]*?>{#if\s*[^}]*?}<\/code>[\w\W]*?)?(?:<code[^>]*?>{#else}<\/code>([\w\W]*?))?<code[^>]*?>{#endif}<\/code>/ig;
		
		while (((m = block_regex.exec(html)) && (regex = block_regex)) || ((m = inline_regex.exec(html)) && (regex = inline_regex))) {
			let result = solve(m[2], regex_undef, uservars);
			if (result == undefined) {
				regex.lastIndex = m.index + m[0].length;
				regex.safeLastIndex = regex.lastIndex;
			} else {
				if (result) { //then
					html = html.substr(0, m.index) + m[3] + html.slice(m.index + m[0].length);
				} else {
					if (m[4] != undefined) html = html.substr(0, m.index) + html.slice(m.index + m[1].length); //elseif
					else if (m[5] != undefined) html = html.substr(0, m.index) + m[5] + html.slice(m.index + m[0].length);  //else
					else html = html.substr(0, m.index) + html.slice(m.index + m[0].length); //false
				}

				html = html.replace(/<\/([uo]l)>[\s\\nt]*?(<\1[^>]*?>)/gi, "");
				regex.lastIndex = regex.safeLastIndex ? regex.safeLastIndex : 0;

			}
		}
		
		let row_regex = /(<(tr|li)\b[^>]*?condition=\\?['"](.*?)\\?['"][^>]*?>)[\w\W]*?<\/\2>/ig;
		while (m = row_regex.exec(html)) {
			let result = solve(m[3], regex_undef, uservars);
			if (result == undefined) {
				row_regex.lastIndex = m.index + m[0].length;
				row_regex.safeLastIndex = row_regex.lastIndex;
			} else {
				if (result) html = html.substr(0, m.index) + m[1].replace(/\b(?:condition|title)=\\?['"].*?\\?['"]\s*/gi,"") + html.slice(m.index + m[1].length);
				else html = html.substr(0, m.index) + html.slice(m.index + m[0].length);
				row_regex.lastIndex = row_regex.safeLastIndex ? row_regex.safeLastIndex : 0;
			}
		}
		
		return html;
	};

	
	//aplicar condições com exceção das funções e variáveis diferidas
	html = apply_conditions(html, true);

	//montar lista de variáveis a serem fornecidas pelo usuário
	var vars = undefined;
	html = html.replace(/%var\(([^;)%]+);(text|check|calendar|choice(?:&\w+;|[^;])*?);((?:&\w+;|[^;])+)(?:;(.*?))?\)%/gi, (m0, name, type, label, _default) => {
		if (!vars) vars = {};
		let var_id = identityNormalize(name.replace(/@.+/, ""));
		
		let default_value = undefined;
		
		_default = replace_uservars(_default);

		if (_default) {
			if (type == "check") {
				default_value = solve(_default, null, uservars);
				_default = "";
			} else if (_default.length <= 3 || _default != _default[0].repeat(_default.length)) default_value = _default;
		}
		
		let list = undefined;
		if (mlist = type.match(/^\s*\bchoice\b\s*:?(?:\s*(.*))?\s*$/i)) {
			if (mlist[1]) {
				type = "select";
				list = mlist[1];
			} else type = "text";
		} else if (type.match(/^\s*\bcalendar\b\s*$/i)) type = "date";
		
		if (!vars[var_id]) vars[var_id] = {id: var_id, type: type, label: label, value: default_value, items: list};
		return `%var(${name}${_default?";"+_default:""})%`;
	});
	
 	(async function(html) {
		//executar operações diferidas primeiro
		
 		if (!html || !html.match(/%(?:var|extrato)\(.*\)%/i)) return html;
		
	 	if (vars) {
			let ffs = [];
			for (let f in vars) if (vars.hasOwnProperty(f)) ffs.push(vars[f]);
			
			let data = await openFormDlg(ffs, "Campos do documento", {alwaysResolve: true, backgroundOpacity: 0, backgroundColor: "#aaa", nullable: false}).catch(err => {return null});
			if (!data) return html;
			
			for (let v in data) {
				if (data.hasOwnProperty(v)) {
					html = html.replace(new RegExp(`%var\\(${v}(?:@(-?\\d+,?\\d*?))?(?:;([^)]+))?\\)%`, "ig"), (m0, m1, m2) => {
						return data[v] ? formatValue(data[v], m1) : typeof data[v] == "boolean" ? data[v] : m2 ? m2 : "";
					});
					uservars[v]= data[v];
				} 
			}
		} 
		
		html = html.replace(/%var\([^;]*?(?:;(.*))?\)%/ig, (m0, m1) => (m1?m1:""));

		//aplicar condições com exceção das funções e variáveis diferidas
		html = apply_conditions(html, true);
		
		
		//executar funções extrato
		let extratos = null;
		html = html.replace(/%extrato\(\s*([^;\)]+)\s*(?:;\s*(\w)\s*(?:;(.*))?)?\)%/ig, (m0, fistel, status, filtro) => {
			fistel = replace_uservars(fistel).replace(/[^\d,]/g, "");
			filtro = replace_uservars(filtro);
			
			if (!fistel.match(/^\d{11}(?:,\d{11})*$/)) return "";
			
			let id = "extrato_" + Math.floor((Math.random() * 100000));
			let extr = {id: id, fistel: fistel, status: status, filtro: !filtro ? null : filtro.replace(/\bAND\b/g, "&&").replace(/\bOR\b/g, "||").replace(/\bNOT\b/g, "!")};
			if (!extratos) extratos = [];
			extratos.push(extr);
			return "$" + id;
		});
		
		if (extratos) {
			for (let extr of extratos) {
				let lanctos = [];
				for (let f of extr.fistel.split(",")) {
					try {
						waitMessage(`Consultando extrato do fistel ${f}...`);
						let extrato = await consultarExtrato(f, extr.filtro);
						if (extrato && extrato.lancamentos && extrato.lancamentos.length) lanctos.push(...extrato.lancamentos.map(l => {
							l.fistel = f;
							return l;
						}));
					} catch (err) {
						errorMessage(err);
					}
				}
				uservars[extr.id] = lanctos;
			}
		}
		
		return html; 

	})(html).then(html => {
		
		//aplicar condições com funções e variáveis diferidas
		html = apply_conditions(html, false);
		
		//executar operações ternárias
		html = html.replace(/<code[^>]*?>\s*{#\?([^?]*)\?([^:}]*)(?::([^}]*))}\s*<\/code>/gi, (m0, expr, is_true, is_false) => {
			return solve(expr, null, uservars) ? is_true : is_false ? is_false : "";
		});
		
		//interpretar sequenciadores
		seq = {};
		html = html.replace(/%seq_([^%]+)%/ig, (m0, name) => {
			if (seq[name] == undefined) seq[name] = 1;
			else seq[name]++;

			return seq[name].toString();
		});
		
		//links para boletos
		html = html.replace(/%link_boleto\((.*?)(?:\s*;(.*?))?(?:\s*;(.*?))?\)%/ig, (m0, text, fistel, cpfj) => {
			if (!fistel && !(fistel = findFieldValue(fields, "fistel", "num"))) fistel = "";
			else fistel = validateFistel(fistel) ? fistel : "";
			
			if (!cpfj && !(cpfj = cpfj_int)) return cpfj = "";
			else cpfj = validateCpfj(cpfj) ? cpfj.replace(/\D/g,"") : "";
			
			let url;
			
			if (fistel && cpfj) url = `https://sistemas.anatel.gov.br/Boleto/Internet/Consulta.asp?indTipoBoleto=d&indTipoConsulta=c&Ano=&Mes=&Ordenacao=datavencimento&PaginaOrigem=&acao=c&MC=&cmd=&plataforma=E&Sistema=&NumCNPJCPF=${cpfj}&NumFistel=${fistel}`;
			else url = `https://sistemas.anatel.gov.br/Boleto/Internet/Tela.asp?NumCNPJCPF=${cpfj}&NumFistel=${fistel}`;
			
			return `<a data-cke-saved-href="${url}" href="${url}" target="_blank">${text}</a>`;
			
		});
		
		let parser = new DOMParser();
		let doc = parser.parseFromString(html, "text/html");
		let $tables = $(doc).find("table[dynamic-table]");

		//atualizar tabelas dinâmicas
		if ($tables.length) {
			waitMessage("Atualizando tabelas dinâmicas...");
			
			let write_row_message = (t, m, c="red") => {
				$(t).find("tbody tr").remove();
				let n_cols = $(t).find("thead tr:last th").length;
				$(t).find("tbody").append(`<tr><td colspan="${n_cols}"><p class="Tabela_Texto_Centralizado" style="${c?"color:" + c + ";":""}">${m}</p></td></tr>`)
			};
			
			$tables.each((index, table) => {
				
				let table_type = $(table).attr("dynamic-table").toLowerCase();
				let table_id = $(table).attr("dynamic-table-id");
				let table_data = solve($(table).attr("dynamic-table-data"), null, uservars);

				$(table).removeAttr("dynamic-table dynamic-table-id dynamic-table-data");
				
				if (!table_data) {
					write_row_message(table, "Nenhum dado para preenchimento da tabela");
					return;
				}
				
				if (!Array.isArray(table_data)) {
					write_row_message(table, "Dados incompatíveis com a tabela");
					return;
				}
				
				if (!table_data.length) {
					write_row_message(table, "Tabela vazia");
					return;
				}
				
				let row_template_html = $(table).find("tbody tr:first").get(0);
				if (!row_template_html) {
					write_row_message(table, "Linha de preenchimento inexistente");
					return;
				}
				
				$(table).find("tbody tr").remove();
				
				row_template_html = row_template_html.outerHTML;
				let formater = {};
				switch (table_type) {
					case "lancto": formater = {seq: (r,v) => v.toString().padStart(3,'0'),
											   valor: (r,v) => v.toMoney(),
											   situacao: (r,v) => r.pendente ? `<span style="color: ${r.status == "V" ? "blue" : "red"};">${v}</span>` : v};
								   break;
				}
				
				for (let row of table_data) {
					let tr = row_template_html.replace(/{([\w_]+)}/ig, (m0, col) => {
						let fmt = formater[col];
						if (fmt) return fmt(row, row[col]);
						return row[col];
					});
					$(table).find("tbody").append(tr);
					
				}
			});
		}
		
		waitMessage();
		
		//colocar ponto final no último item da lista
		$(doc).find('ul li:last').each((i, li) => $(li).html($(li).html().replace(/([\w\W]*);(<[^>]*?>|\n|\s)*$/, "$1.$2")));
		
		//substituir variáveis restantes
		html = replace_uservars(doc.body.innerHTML);
		
		$(editor).val(html);
		
		return waitDocumentReady(`#cke_${editor.name} iframe`).then(doc => {
			$(doc.body).html(html);
			return doc;
		});
		
	}).then(doc => {
		
		
		//arrastar e soltar link de documento SEI
		$(doc.body).on("dragover", e => {
			e.preventDefault();
			let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
			if (link_id) return false;
		}).on("drop", e => {
			let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
			
			if (link_id) {
				let sei_number = e.originalEvent.dataTransfer.getData("sei/number");
		
				e.preventDefault();
				let sel = doc.getSelection();
				let range = sel.getRangeAt(sel.rangeCount-1);
				let $node = $(`<span data-cke-linksei="1" style="text-indent:0px;" contenteditable="false">SEI nº <a id="lnkSei${link_id}" class="ancoraSei" style="text-indent:0px;">${sei_number}</a></span>`);
				range.deleteContents();
				range.insertNode($node[0]);
				range.collapse();
				return false;
			}
		});
		
		//redimensionar documento
		$(`#cke_${editor.name} iframe`).parent().css("height", $(doc).height())		
		
		//habilitar botão de salvamento
		let script = document.createElement('script');
		script.id = "habSalvarScript";
		script.textContent = `var hs = setInterval(function() {
			for (inst in CKEDITOR.instances) if (CKEDITOR.instances[inst].status != "ready") return;
			clearInterval(hs);
			habilitaSalvar({name:'drop'});
			document.getElementById("habSalvarScript").remove();
		}, 400);`;
		(document.body||document.documentElement).appendChild(script); 
		
	});
	
} else {
	
		waitDocumentReady(`iframe`, 'body[contenteditable=true]').then(doc => {
			
			//arrastar e soltar link de documento SEI
			$(doc.body).on("dragover", e => {
				e.preventDefault();
				let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
				if (link_id) return false;
			}).on("drop", e => {
				let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
				
				if (link_id) {
					let sei_number = e.originalEvent.dataTransfer.getData("sei/number");
			
					e.preventDefault();
					let sel = doc.getSelection();
					let range = sel.getRangeAt(sel.rangeCount-1);
					let $node = $(`<span data-cke-linksei="1" style="text-indent:0px;" contenteditable="false">SEI nº <a id="lnkSei${link_id}" class="ancoraSei" style="text-indent:0px;">${sei_number}</a></span>`);
					range.deleteContents();
					range.insertNode($node[0]);
					range.collapse();
					return false;
				}
			});
			
		});	
	
}