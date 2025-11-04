import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));{
 providers: [
    provideRouter(routes),
    provideHttpClient() // 👈 AQUI se inyecta el HttpClient globalmente
  ]
  }
