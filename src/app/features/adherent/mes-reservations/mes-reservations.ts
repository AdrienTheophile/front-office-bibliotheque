import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdherentService } from '../../../core/services/adherent';

@Component({
  selector: 'app-mes-reservations',
  imports: [CommonModule],
  templateUrl: './mes-reservations.html',
})
export class MesReservations implements OnInit {
  private readonly adherentService = inject(AdherentService);

  reservations = this.adherentService.reservations;
  chargement = this.adherentService.chargement;
  erreur = this.adherentService.erreur;

  // Computed: nombre de réservations
  nombreReservations = computed(() => this.reservations().length);

  // Computed: peut-on ajouter une réservation (max 3)
  peutReserver = computed(() => this.nombreReservations() < 3);

  ngOnInit(): void {
    // Charger les réservations au démarrage
    this.adherentService.obtenirReservations().subscribe();
  }

  annulerReservation(reservationId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.adherentService.annulerReservation(reservationId).subscribe();
    }
  }
}

