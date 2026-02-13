import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auteur } from '../../../core/models';

@Component({
  selector: 'app-liste-auteurs',
  imports: [CommonModule, FormsModule],
  templateUrl: './liste-auteurs.html',
})
export class ListeAuteurs {
  auteurs = signal<Auteur[]>([
    { id: 1, nom: 'Victor Hugo', biographie: 'Écrivain français du 19ème siècle' },
    { id: 2, nom: 'Gustave Flaubert', biographie: 'Auteur français de Madame Bovary' },
    { id: 3, nom: 'Émile Zola', biographie: 'Écrivain naturaliste français' },
    { id: 4, nom: 'Jules Verne', biographie: 'Auteur de science-fiction français' },
  ]);

  rechercheAuteur = signal('');

  get auteursFiltres(): Auteur[] {
    const terme = this.rechercheAuteur().toLowerCase();
    return this.auteurs().filter(a => a.nom.toLowerCase().includes(terme));
  }
}

