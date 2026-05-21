export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  mustChangePassword?: boolean;
  role: 'admin' | 'editor' | 'reader';
  permissions?: string[];
  household?: import('./household').HouseholdProfile;
}

export interface RawApiUser {
  id: number;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  username?: string;
  must_change_password?: boolean;
  role?: string;
  permissions?: string[];
  household?: import('./household').RawApiHousehold;
}
