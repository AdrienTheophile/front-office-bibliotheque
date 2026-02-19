import { Component, inject, OnInit } from '@angular/core';
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

  livre: Livre | null = null;
  estDisponible = estDisponible;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.livreService.obtenirLivreParId(id).subscribe(livre => {
          this.livre = livre;
        });
      }
    });
  }
}

