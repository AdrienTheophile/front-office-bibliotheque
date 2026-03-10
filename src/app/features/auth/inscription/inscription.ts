import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth } from '../../../core';

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
  private readonly authService = inject(Auth);

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.inscriptionForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      telephone: [''],
      adresse: ['']
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.inscriptionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
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
    
    this.authService.inscrire(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '✓ Compte créé avec succès ! Redirection vers la connexion...';
      },
      error: (erreur: any) => {
        this.isLoading = false;
        // Récupérer le message d'erreur du backend
        let message = 'Une erreur est survenue lors de l\'inscription.';
        if (erreur.error?.email) {
          message = erreur.error.email;
        } else if (erreur.error?.error) {
          message = erreur.error.error;
        } else if (erreur.error?.message) {
          message = erreur.error.message;
        }
        this.errorMessage = message;
      }
    });
  }
}
