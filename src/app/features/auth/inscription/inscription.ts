import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const API_URL = 'https://localhost:8008/api';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './inscription.html',
  styleUrl: './inscription.css',
})
export class Inscription implements OnInit {
  inscriptionForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.inscriptionForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
      telephone: ['', [Validators.pattern(/^(\+33|0)[1-9](\d{2}){4}$/)]],
      adresse: ['', [Validators.minLength(5)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.inscriptionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.inscriptionForm.get(fieldName);
    if (!field || !field.errors || !(field.dirty || field.touched)) return '';
    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    if (field.errors['email']) return 'Adresse email invalide';
    if (field.errors['pattern']) {
      const messages: Record<string, string> = {
        prenom: 'Le prénom ne doit contenir que des lettres',
        nom: 'Le nom ne doit contenir que des lettres',
        motDePasse: 'Doit contenir au moins une majuscule, une minuscule et un chiffre',
        telephone: 'Format attendu : 0612345678 ou +33612345678',
      };
      return messages[fieldName] || 'Format invalide';
    }
    return 'Valeur invalide';
  }

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.inscriptionForm.value;

    // Envoyer vers l'API d'inscription
    // Le body correspond à ce que le backend attend
    this.http.post<any>(`${API_URL}/register`, {
      email: formData.email,
      password: formData.motDePasse,
      nom: formData.nom,
      prenom: formData.prenom,
      numTel: formData.telephone || null,
      adressePostale: formData.adresse || null,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '✓ Compte créé avec succès ! Redirection vers la connexion...';
        setTimeout(() => this.router.navigate(['/connexion']), 1500);
      },
      error: (erreur: any) => {
        this.isLoading = false;
        let message = 'Une erreur est survenue lors de l\'inscription.';
        if (erreur.status === 0) {
          message = 'Impossible de joindre le serveur (https://localhost:8008)';
        } else if (erreur.error?.detail) {
          message = erreur.error.detail;
        } else if (erreur.error?.message) {
          message = erreur.error.message;
        } else if (typeof erreur.error === 'string') {
          message = erreur.error;
        }
        this.errorMessage = message;
      }
    });
  }
}
