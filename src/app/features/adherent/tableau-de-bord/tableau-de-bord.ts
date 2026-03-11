import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';

@Component({
  selector: 'app-tableau-de-bord',
  imports: [CommonModule, RouterLink],
  templateUrl: './tableau-de-bord.html',
})
export class TableauDeBord implements OnInit {
  private readonly authService = inject(Auth);
  private readonly adherentService = inject(AdherentService);

  adherent = this.authService.adherentActuel;
  estAdherent = this.authService.estAdherent;

  emprunts = this.adherentService.emprunts;
  empruntsEnCours = this.adherentService.empruntsEnCours;
  reservations = this.adherentService.reservations;
  chargement = this.adherentService.chargement;
  erreurEmprunts = this.adherentService.erreurEmprunts;
  erreurReservations = this.adherentService.erreurReservations;

  ngOnInit(): void {
    if (this.authService.estAdherent()) {
      this.adherentService.obtenirEmprunts().subscribe({
        error: (err: any) => console.error('Erreur chargement emprunts:', err)
      });
      this.adherentService.obtenirReservations().subscribe({
        error: (err: any) => console.error('Erreur chargement réservations:', err)
      });
    }
  }
}

