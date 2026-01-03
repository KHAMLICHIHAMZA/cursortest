/**
 * Utilitaires pour le calcul des tâches agents
 * 
 * IMPORTANT (Spécifications MALOC) :
 * - Les tâches agents sont DÉRIVÉES des bookings, jamais persistées
 * - Aucune entité Task n'est stockée en base de données
 * - Les tâches sont calculées à la volée depuis les statuts de booking
 * - Le planning des tâches vit UNIQUEMENT dans l'app Agent
 * 
 * Conformité : SPECIFICATIONS_FONCTIONNELLES.md
 */

import { Booking, AgentTask, TaskType } from '../types';

/**
 * Calcule les tâches agents depuis une liste de bookings
 * 
 * Logique de dérivation (selon spécifications) :
 * - Booking CONFIRMED → Tâche "Livraison / Check-in"
 * - Booking ACTIVE → Tâche "Récupération / Check-out"
 * - Booking COMPLETED → Tâche en mode consultation (si includeCompleted = true)
 * - Booking CANCELLED → Aucune tâche
 * 
 * @param bookings Liste des bookings
 * @param includeCompleted Si true, inclut les bookings COMPLETED en mode consultation
 * @returns Liste des tâches dérivées, ordonnées par date/heure
 */
export function getAgentTasks(bookings: Booking[], includeCompleted: boolean = false): AgentTask[] {
  const tasks: AgentTask[] = [];

  for (const booking of bookings) {
    // Booking CONFIRMED → Tâche "Livraison / Check-in"
    if (booking.status === 'CONFIRMED') {
      tasks.push({
        id: booking.id, // Utilise booking.id comme identifiant
        type: 'CHECK_IN',
        bookingId: booking.id,
        vehicle: {
          id: booking.vehicleId,
          // Les données véhicule complètes sont dans booking.vehicle si disponible
          brand: (booking as any).vehicle?.brand,
          model: (booking as any).vehicle?.model,
          registrationNumber: (booking as any).vehicle?.registrationNumber,
        },
        client: {
          id: booking.clientId,
          // Les données client complètes sont dans booking.client si disponible
          name: (booking as any).client?.name,
          phone: (booking as any).client?.phone,
        },
        date: booking.startDate, // Date de début = date de livraison
        location: (booking as any).pickupLocation, // Lieu de prise en charge
        booking, // Référence complète au booking
      });
    }

    // Booking ACTIVE → Tâche "Récupération / Check-out"
    if (booking.status === 'ACTIVE') {
      tasks.push({
        id: booking.id,
        type: 'CHECK_OUT',
        bookingId: booking.id,
        vehicle: {
          id: booking.vehicleId,
          brand: (booking as any).vehicle?.brand,
          model: (booking as any).vehicle?.model,
          registrationNumber: (booking as any).vehicle?.registrationNumber,
        },
        client: {
          id: booking.clientId,
          name: (booking as any).client?.name,
          phone: (booking as any).client?.phone,
        },
        date: booking.endDate, // Date de fin = date de récupération
        location: (booking as any).returnLocation, // Lieu de retour
        booking,
      });
    }

    // Booking COMPLETED → Tâche en mode consultation (si demandé)
    if (includeCompleted && booking.status === 'COMPLETED') {
      // Pour les bookings complétés, on crée une tâche CHECK_OUT (car le check-out a été fait)
      tasks.push({
        id: booking.id,
        type: 'CHECK_OUT',
        bookingId: booking.id,
        vehicle: {
          id: booking.vehicleId,
          brand: (booking as any).vehicle?.brand,
          model: (booking as any).vehicle?.model,
          registrationNumber: (booking as any).vehicle?.registrationNumber,
        },
        client: {
          id: booking.clientId,
          name: (booking as any).client?.name,
          phone: (booking as any).client?.phone,
        },
        date: booking.endDate || booking.updatedAt, // Date de fin ou date de mise à jour
        location: (booking as any).returnLocation, // Lieu de retour
        booking,
      });
    }

    // Booking CANCELLED → Aucune tâche (ignorés)
  }

  // Ordonner par date/heure (selon spécifications : "ordonnées par date / heure")
  return tasks.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Ordre décroissant (plus récent en premier)
  });
}

/**
 * Filtre les tâches par type
 * 
 * @param tasks Liste des tâches
 * @param type Type de tâche à filtrer
 * @returns Tâches filtrées
 */
export function filterTasksByType(tasks: AgentTask[], type: TaskType): AgentTask[] {
  return tasks.filter(task => task.type === type);
}

/**
 * Filtre les tâches par date
 * 
 * @param tasks Liste des tâches
 * @param date Date de référence
 * @returns Tâches du jour
 */
export function filterTasksByDate(tasks: AgentTask[], date: Date): AgentTask[] {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return tasks.filter(task => {
    const taskDate = new Date(task.date).toISOString().split('T')[0];
    return taskDate === dateStr;
  });
}

/**
 * Compte les tâches par type
 * 
 * @param tasks Liste des tâches
 * @returns Compteur par type
 */
export function countTasksByType(tasks: AgentTask[]): { checkIn: number; checkOut: number } {
  return {
    checkIn: tasks.filter(t => t.type === 'CHECK_IN').length,
    checkOut: tasks.filter(t => t.type === 'CHECK_OUT').length,
  };
}

/**
 * Groupe les tâches par sections (Aujourd'hui, À venir, En retard)
 * 
 * @param tasks Liste des tâches
 * @returns Tâches groupées par section
 */
export type TaskSection = {
  key: 'today' | 'upcoming' | 'overdue' | 'completed';
  title: string;
  tasks: AgentTask[];
};

export function groupTasksBySections(tasks: AgentTask[], includeCompleted: boolean = false, completedBookings?: Booking[]): TaskSection[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const today: AgentTask[] = [];
  const upcoming: AgentTask[] = [];
  const overdue: AgentTask[] = [];
  const completed: AgentTask[] = [];

  // Séparer les tâches actives des tâches complétées
  const activeTasks: AgentTask[] = [];
  const completedTaskIds = new Set<string>();

  if (includeCompleted && completedBookings) {
    // Créer un Set des IDs de bookings complétés pour identifier les tâches complétées
    completedBookings.forEach(booking => {
      if (booking.status === 'COMPLETED') {
        completedTaskIds.add(booking.id);
      }
    });
  }

  tasks.forEach(task => {
    // Si la tâche correspond à un booking complété, l'ajouter à la section complétée
    if (includeCompleted && completedTaskIds.has(task.bookingId)) {
      completed.push(task);
    } else {
      activeTasks.push(task);
    }
  });

  // Grouper les tâches actives par date
  activeTasks.forEach(task => {
    const taskDate = new Date(task.date);
    
    if (taskDate >= todayStart && taskDate < todayEnd) {
      today.push(task);
    } else if (taskDate < todayStart) {
      overdue.push(task);
    } else {
      upcoming.push(task);
    }
  });

  const sections: TaskSection[] = [];
  
  if (overdue.length > 0) {
    sections.push({ key: 'overdue', title: 'En retard', tasks: overdue });
  }
  
  if (today.length > 0) {
    sections.push({ key: 'today', title: "Aujourd'hui", tasks: today });
  }
  
  if (upcoming.length > 0) {
    sections.push({ key: 'upcoming', title: 'À venir', tasks: upcoming });
  }

  if (includeCompleted && completed.length > 0) {
    sections.push({ key: 'completed', title: 'Terminées', tasks: completed });
  }

  return sections;
}

