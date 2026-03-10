import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LivreService } from '../../../core/services/book';
import { Auteur } from '../../../core/models';

@Component({
  selector: 'app-liste-auteurs',
  imports: [CommonModule, FormsModule],
  templateUrl: './liste-auteurs.html',
})
export class ListeAuteurs {
  private readonly livreService = inject(LivreService);

  // Récupérer les auteurs de l'API
  auteurs = toSignal(this.livreService.obtenirAuteurs(), { initialValue: [] });
  rechercheAuteur = signal('');

  // Auteurs filtrés
  auteursFiltres = computed(() => {
    const terme = this.rechercheAuteur().toLowerCase();
    return this.auteurs().filter(a =>
      (a.nom?.toLowerCase().includes(terme)) ||
      (a.prenom?.toLowerCase().includes(terme))
    );
  });
}

