import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth-guard';
import { SideBardComponent } from './side-bard/side-bard.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'side-bard', component: SideBardComponent },
    { path: 'transferencia', component: TransferenciaComponent },
  { path: 'login', component: LoginComponent }, // Página de login

];
