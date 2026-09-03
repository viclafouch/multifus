# L'espagnol

Le français et l'anglais sont livrés. L'espagnol reste à écrire.

1. `locales: ['fr', 'en']` devient `['fr', 'en', 'es']` dans `lingui.config.ts`,
   et `lingui extract` ouvre `src/locales/es/messages.po`.
2. `Language::Es` côté Rust, `'es'` côté TypeScript. Les `match` et les
   `satisfies Record<Language, …>` refuseront de compiler tant qu'il manque
   quelque chose : suivre les erreurs suffit.
3. Traduire les 594 messages, puis `pnpm run i18n:check`.

Multifus a une voix très écrite, et un espagnol de machine sonnerait faux là où
le français sonne juste. Le vocabulaire du jeu se vérifie sur le client espagnol,
pas au dictionnaire : les classes, les stats de runes, PA et PM.

`LANGUAGES` est ce que le sélecteur montre. Tant qu'un hispanophone n'a pas relu,
l'espagnol peut exister partout ailleurs et rester hors de cette liste.
