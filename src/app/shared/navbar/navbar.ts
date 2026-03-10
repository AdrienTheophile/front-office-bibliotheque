import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly authService = inject(Auth);
  dropdownOuvert = signal(false);

  toggleDropdown(): void {
    this.dropdownOuvert.update(v => !v);
  }

  seDeconnecter(): void {
    this.dropdownOuvert.set(false);
    this.authService.seDeconnecter();
  }
}
