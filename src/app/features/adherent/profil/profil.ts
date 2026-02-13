import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core';

@Component({
  selector: 'app-profil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profil.html',
})
export class Profil {
  private readonly authService = inject(Auth);
  private readonly fb = inject(FormBuilder);

  adherent = this.authService.adherentActuel;
  formulaire: FormGroup;

  constructor() {
    const adherent = this.adherent();
    this.formulaire = this.fb.group({
      nom: [adherent?.nom || '', Validators.required],
      prenom: [adherent?.prenom || '', Validators.required],
      email: [adherent?.email || '', [Validators.required, Validators.email]],
    });
  }

  sauvegarder(): void {
    if (this.formulaire.valid) {
      console.log('Profil sauvegardé:', this.formulaire.value);
      // TODO: Appeler API pour sauvegarder
    }
  }
}

