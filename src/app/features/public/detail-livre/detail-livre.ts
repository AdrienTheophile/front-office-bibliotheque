import { Component, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LivreService } from '../../../core';
import { Livre, estDisponible } from '../../../core/models';

@Component({
  selector: 'app-detail-livre',
  imports: [CommonModule, RouterLink],
  templateUrl: './detail-livre.html',
})
export class DetailLivre implements OnInit {
  private readonly livreService = inject(LivreService);
  private readonly route = inject(ActivatedRoute);

  livre = signal<Livre | null>(null);
  chargement = signal(false);
  erreur = signal<string | null>(null);
  estDisponible = estDisponible;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.chargement.set(true);
        this.erreur.set(null);
        this.livreService.obtenirLivreParId(id).subscribe({
          next: (livre) => {
            this.livre.set(livre);
            this.chargement.set(false);
          },
          error: (err) => {
            console.error('Erreur lors du chargement du livre:', err);
            this.erreur.set('Impossible de charger le livre');
            this.chargement.set(false);
          }
        });
      }
    });
  }
}
