﻿$(function() {
	
	const CURRENT_NEWS = 3;

	if (!localStorage.cfor_lastnews || localStorage.cfor_lastnews < CURRENT_NEWS) {
		if (!$(top.window.document.body).find("#btn_cfornews").length) {
			let $btn_news  = $(`<a id="btn_cfornews" class="btn-pulse btn-pulse-red btn-floating" title="Novidades ${browser.runtime.getManifest().version}"><img style="vertical-align: middle; margin: 0; transform: scale(0.87);"></a>`);
			$btn_news.find('img').attr("src", browser.runtime.getURL("assets/logo-24w.png"));
			$(top.window.document.body).append($btn_news);
			
			$btn_news.click(e => {
				chrome.runtime.sendMessage({action: "open", url: getCforUrl("/extension/help/news.php")});
				$btn_news.remove();
				localStorage.cfor_lastnews = CURRENT_NEWS;
			});
		}
	}

	 
	//Atalhos
	/* if ((btnSalvar = $(':submit[value=Salvar]').get(0) || $(':button[value="Confirmar Dados"]').get(0) || $(':button[value="Salvar"]').get(0))) {
		let keyDownHandler = function (e) {
			if (e.ctrlKey && e.key == "Enter") {
				e.preventDefault();
				e.stopPropagation();
				for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).off('keydown', keyDownHandler);
				$(btnSalvar).trigger("click");
			}
		};

		for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).on('keydown', keyDownHandler);
	} */

	 
	 let keyDownHandler = function (e) {
		if (e.ctrlKey && e.key == "Enter" && (btnSalvar = $(':submit[value=Salvar]').get(0) || $(':button[value="Confirmar Dados"]').get(0) || $(':button[value="Salvar"]').get(0))) {
			e.preventDefault();
			e.stopPropagation();
			for (var i = 0; i < top.window.parent.frames.length; i++) top.window.parent.frames[i].document.removeEventListener('keydown', keyDownHandler);
			$(btnSalvar).trigger("click");
		}
		
		if (e.ctrlKey && e.shiftKey && e.key == "L") {
			e.preventDefault();
			e.stopPropagation();
			openFormDlg([{id: "content", type: "textarea", placeholder: "Texto a ser copiado para a área de transferência", cols: 50, rows: 2}], "Copiar Conteúdo", {icon: "modal-dlg-icon-copy", confirmButton: "Copiar"}).then(data => {
				setClipboard(data.content);
			});
		}
		
	 
	};

	for (var i = 0; i < top.window.parent.frames.length; i++) top.window.parent.frames[i].document.addEventListener('keydown', keyDownHandler, true);
	top.window.addEventListener('keydown', keyDownHandler, true);

	
/* 	if (main_menu = top.window.document.getElementById("main-menu"))  {
		
		if (!$(main_menu).find('#link-cpag').get(0)) {
				$(main_menu).append('<li><a id="link-cpag" href="#" title="CPAG">Controle de Pagamento</a></li>');
				$(main_menu).find('#link-cpag').click(e => {
					var $tela = $(top.window.document.body).find('#divInfraAreaTelaD');
					loadInternalPage($tela, "cpag/cpag.html", "SEI - Controle de Pagamento");
				});
		}
		
	} */

});