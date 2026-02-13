import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-statistiques',
  imports: [CommonModule],
  templateUrl: './statistiques.html',
})
export class Statistiques {
  // Mock data pour statistiques
  stats = signal({
    totalLivres: 1250,
    totalAdherents: 480,
    totalEmprunts: 5240,
    empruntsActifs: 380,
    reservationsEnAttente: 45,
    livresEnRetard: 12,
  });

  topLivres = signal([
    { titre: '1984', emprunts: 156 },
    { titre: 'Le Seigneur des Anneaux', emprunts: 142 },
    { titre: 'Harry Potter', emprunts: 138 },
  ]);
}

