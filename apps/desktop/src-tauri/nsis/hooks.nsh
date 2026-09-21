LangString welcomeTitle 1036 "Installer Multifus"
LangString welcomeTitle 1033 "Install Multifus"
LangString welcomeTitle 1034 "Instalar Multifus"

LangString welcomeText 1036 "Multifus s'installe en quelques secondes.$\r$\n$\r$\nInutile de fermer Dofus Retro : vos personnages restent connectés."
LangString welcomeText 1033 "Multifus installs in a few seconds.$\r$\n$\r$\nNo need to close Dofus Retro: your characters stay logged in."
LangString welcomeText 1034 "Multifus se instala en unos segundos.$\r$\n$\r$\nNo hace falta cerrar Dofus Retro: tus personajes siguen conectados."

LangString finishTitle 1036 "Multifus est installé"
LangString finishTitle 1033 "Multifus is installed"
LangString finishTitle 1034 "Multifus está instalado"

LangString finishText 1036 "Son icône se trouve près de l'horloge, dans la barre des tâches."
LangString finishText 1033 "Its icon sits next to the clock, in the taskbar."
LangString finishText 1034 "Su icono está junto al reloj, en la barra de tareas."

!define MUI_WELCOMEPAGE_TITLE "$(welcomeTitle)"
!define MUI_WELCOMEPAGE_TEXT "$(welcomeText)"
!define MUI_FINISHPAGE_TITLE "$(finishTitle)"
!define MUI_FINISHPAGE_TEXT "$(finishText)"

!macro NSIS_HOOK_PREUNINSTALL
  ${If} $UpdateMode <> 1
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "${PRODUCTNAME}"
    nsExec::Exec 'cmdkey /delete:telegram-bot-token.com.viclafouch.multifus'
  ${EndIf}
!macroend
