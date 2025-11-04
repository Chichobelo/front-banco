
export interface RegisterRequest {
    id?:number;
    username: string; 
    documentType : string
    numberDocument: number// Nombre de usuario
    password: string;   // Contraseña
    name: string;   // nombre
    role: Role;
  }
  export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
  }