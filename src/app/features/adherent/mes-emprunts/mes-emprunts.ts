import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpruntService } from '../../../core';

@Component({
  selector: 'app-mes-emprunts',
  imports: [CommonModule],
  templateUrl: './mes-emprunts.html',
})
export class MesEmprunts {
  private readonly empruntService = inject(EmpruntService);

  empruntsActifs = this.empruntService.empruntsActifs;
  empruntsEnRetard = this.empruntService.empruntsEnRetard;
  empruntsRetournes = this.empruntService.empruntsRetournes;

  retournerEmprunt(empruntId: number): void {
    this.empruntService.retournerEmprunt(empruntId);
  }

  obtenirJoursAvantLimite(emprunt: any): number | null {
    return this.empruntService.obtenirJoursAvantLimite(emprunt?.id || 0);
  }
}

