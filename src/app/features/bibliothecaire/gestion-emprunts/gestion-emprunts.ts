import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpruntService } from '../../../core';

@Component({
  selector: 'app-gestion-emprunts',
  imports: [CommonModule],
  templateUrl: './gestion-emprunts.html',
})
export class GestionEmprunts {
  private readonly empruntService = inject(EmpruntService);

  empruntsActifs = this.empruntService.empruntsActifs;
  empruntsEnRetard = this.empruntService.empruntsEnRetard;

  retournerEmprunt(empruntId: number): void {
    this.empruntService.retournerEmprunt(empruntId);
    console.log('Emprunt retourn\u00e9:', empruntId);
  }
}

