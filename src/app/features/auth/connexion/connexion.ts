import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../../core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-connexion',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
      motDePasse: ['', [Validators.required]]
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
    }).subscribe({
      next: () => {
        this.enChargement.set(false);
      },
      error: (erreur) => {
        this.enChargement.set(false);
        this.messageErreur.set(this.authService.erreur());
      }
    });
  }

  obtenirMessageErreur(nomChamp: string): string | null {
    const controle = this.formulaire.get(nomChamp);
    if (!controle || !controle.errors || !controle.touched) {
      return null;
    }

    if (controle.errors['required']) {
      const labels: { [key: string]: string } = {
        email: 'Email',
        motDePasse: 'Mot de passe'
      };
      return `${labels[nomChamp] || nomChamp} est requis`;
    }
    if (nomChamp === 'email' && controle.errors['email']) {
      return 'Adresse email invalide';
    }
    if (nomChamp === 'motDePasse' && controle.errors['minlength']) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }

    return null;
  }
}
