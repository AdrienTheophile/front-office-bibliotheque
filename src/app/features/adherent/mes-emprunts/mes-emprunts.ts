import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';
import { Emprunt, StatutEmprunt } from '../../../core/models';

@Component({
  selector: 'app-mes-emprunts',
  imports: [CommonModule],
  templateUrl: './mes-emprunts.html',
})
export class MesEmprunts implements OnInit {
  private readonly adherentService = inject(AdherentService);
  private readonly authService = inject(Auth);

  emprunts = this.adherentService.emprunts;
  chargement = this.adherentService.chargement;
  erreur = this.adherentService.erreur;
  nonAdherent = signal(false);

  // Emprunts filtrés par statut
  empruntsActifs = computed(() =>
    this.emprunts().filter((e) => e.statut === StatutEmprunt.EN_COURS || e.statut === StatutEmprunt.EN_RETARD)
  );

  empruntsEnRetard = computed(() =>
    this.emprunts().filter((e) => e.statut === StatutEmprunt.EN_RETARD)
  );

  empruntsRetournes = computed(() =>
    this.emprunts().filter((e) => e.statut === StatutEmprunt.RETOURNE)
  );

  ngOnInit(): void {
    if (!this.authService.estAdherent()) {
      this.nonAdherent.set(true);
      return;
    }
    this.adherentService.obtenirEmprunts().subscribe();
  }

  retournerEmprunt(empruntId: number): void {
    // TODO: Implémenter le retour d'emprunt via l'API
    console.log('Retour d\'emprunt:', empruntId);
  }

  obtenirJoursAvantLimite(emprunt: Emprunt): number {
    const dateLimite = new Date(emprunt.dateRetour);
    const aujourd = new Date();
    const jours = Math.ceil((dateLimite.getTime() - aujourd.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, jours);
  }
}

