## Test
- [OK] Import de la liste de clients sur le telephone
- [OK] Import de la liste de transactions sur l'ordinateur
- [OK] Export de la liste de clients sur l'ordinateur.
- [OK] Export de la liste de transaction sur le telephone
- [OK] Realisation de quelques transactions.
  
## Fix
- [OK] [PC] (tout doit se faire coté NextJS UNIQUEMENT, on ne touche pas au code du mobile) **Evitement des doublons de transactions à l'import** Il faut rajouter un locket pour ne pas importer les transactions qui ont déja importées, pour cela il faut regarder les id des transactions entrantes. on a 2 options
  - Soit on conserve ces id pour les stocker, donc on ne crée pas de nouveaux id. Ainsi la clause d'unicité de l'id reglera le probleme
  - Soit on rajoute une colonne (external id) comme id extérieur qui permettra de s'assuter qu'on ne copie pas un truc déja existant

## Features
- Wrapping avec electron (en dev)
- Configuration du build electron
- personnaliser la barre d'options du wrapper pour avoir des
- Ajouter les scripts de mise à jour (update de code, sauvegarde de bd, migration de bd)

## Mobiles features
- Modifier une transaction
- Modifier l'export pour proposer un export partiel et un export total.
