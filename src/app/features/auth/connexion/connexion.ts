import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-connexion',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './connexion.html',
  styleUrl: './connexion.css',
})
export class Connexion {
  private readonly authService = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  formulaire: FormGroup;
  enChargement = signal(false);
  messageErreur = signal<string | null>(null);

  constructor() {
    this.formulaire = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  seConnecter(): void {
    if (this.formulaire.invalid) {
      this.messageErreur.set('Veuillez vérifier vos identifiants');
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);

    const { email, motDePasse } = this.formulaire.value;

    this.authService.seConnecter({
      email,
      motDePasse
    });

    // Simulé: après 1 seconde, on arrête le chargement
    setTimeout(() => {
      this.enChargement.set(false);
    }, 1000);
  }

  obtenirMessageErreur(nomChamp: string): string | null {
    const controle = this.formulaire.get(nomChamp);
    if (!controle || !controle.errors || !controle.touched) {
      return null;
    }

    if (controle.errors['required']) {
      return `${nomChamp} est requis`;
    }
    if (nomChamp === 'email' && controle.errors['email']) {
      return 'Email invalide';
    }
    if (nomChamp === 'motDePasse' && controle.errors['minlength']) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }

    return null;
  }
}
