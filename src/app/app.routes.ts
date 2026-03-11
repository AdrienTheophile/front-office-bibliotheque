import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: Login },

  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/connexion/connexion').then(m => m.Connexion)
  },

  {
    path: 'non-autorise',
    loadComponent: () => import('./features/auth/non-autorise/non-autorise').then(m => m.NonAutorise)
  },
  
  // Routes publiques
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/accueil/accueil').then(m => m.Accueil)
      },
      {
        path: 'catalogue',
        loadComponent: () => import('./features/public/catalogue/catalogue').then(m => m.Catalogue)
      },
      {
        path: 'livres/:id',
        loadComponent: () => import('./features/public/detail-livre/detail-livre').then(m => m.DetailLivre)
      },
      {
        path: 'auteurs',
        loadComponent: () => import('./features/public/liste-auteurs/liste-auteurs').then(m => m.ListeAuteurs)
      }
    ]
  },
  
  // Espace adhérent
  {
    path: 'tableau-de-bord',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/adherent/tableau-de-bord/tableau-de-bord').then(m => m.TableauDeBord)
      },
      {
        path: 'profil',
        loadComponent: () => import('./features/adherent/profil/profil').then(m => m.Profil)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/adherent/mes-reservations/mes-reservations').then(m => m.MesReservations)
      },
      {
        path: 'emprunts',
        loadComponent: () => import('./features/adherent/mes-emprunts/mes-emprunts').then(m => m.MesEmprunts)
      }
    ]
  },
  
  // Espace bibliothécaire
  {
    path: 'bibliothecaire',
    canActivate: [roleGuard('ROLE_BIBLIO', 'ROLE_ADMIN')],
    children: [
      {
        path: 'emprunts',
        loadComponent: () => import('./features/bibliothecaire/gestion-emprunts/gestion-emprunts').then(m => m.GestionEmprunts)
      }
    ]
  },
  
  // Espace responsable
  {
    path: 'responsable',
    canActivate: [roleGuard('ROLE_ADMIN')],
    children: [
      {
        path: 'statistiques',
        loadComponent: () => import('./features/responsable/statistiques/statistiques').then(m => m.Statistiques)
      }
    ]
  },
  
  {
    path: '**',
    redirectTo: ''
  }
];