import { Component, signal } from '@angular/core';
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
    { 
      idAut: 1,
      nom: 'Hugo', 
      prenom: 'Victor', 
      dateNaissance: '1802-02-26',
      dateDeces: '1885-05-22',
      description: 'Écrivain français du 19ème siècle'
    },
    { 
      idAut: 2, 
      nom: 'Flaubert', 
      prenom: 'Gustave', 
      dateNaissance: '1821-12-12',
      dateDeces: '1880-05-08',
      description: 'Auteur français de Madame Bovary'
    },
    { 
      idAut: 3, 
      nom: 'Zola', 
      prenom: 'Émile', 
      dateNaissance: '1840-04-02',
      dateDeces: '1902-09-28',
      description: 'Écrivain naturaliste français'
    },
    { 
      idAut: 4, 
      nom: 'Verne', 
      prenom: 'Jules', 
      dateNaissance: '1828-02-08',
      dateDeces: '1905-03-24',
      description: 'Auteur de science-fiction français'
    },
  ]);

  rechercheAuteur = signal('');

  get auteursFiltres(): Auteur[] {
    const terme = this.rechercheAuteur().toLowerCase();
    return this.auteurs().filter(a => 
      (a.nom.toLowerCase().includes(terme)) || 
      (a.prenom?.toLowerCase().includes(terme))
    );
  }
}

