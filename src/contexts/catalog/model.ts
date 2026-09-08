export type SearchResult = {
  type: "service" | "doctor" | "clinic" | "content";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type DoctorCard = {
  id: string;
  name: string;
  specialty: string | null;
  cityId: string | null;
  imageUrl: string | null;
  medicalCouncilCode?: string | null;
};

export type ServiceCard = {
  id: string;
  name: string;
  providerName: string;
  serviceType: string;
  category: string | null;
  cityId: string | null;
  price: string;
  durationMinutes: number;
};