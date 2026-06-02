export interface OperatingHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  return `${parts[0]}:${parts[1]}`;
}

export function formatOperatingHours(hours?: OperatingHour[]): string[] {
  const daysOfWeekNames = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  if (!hours || hours.length === 0) {
    return ["Horário de funcionamento não configurado"];
  }

  // Create a complete 7-day schedule map
  const schedules = Array.from({ length: 7 }, (_, i) => {
    const dayHour = hours.find(h => h.day_of_week === i);
    return {
      dayName: daysOfWeekNames[i],
      isClosed: dayHour ? dayHour.is_closed : true,
      openTime: dayHour ? formatTime(dayHour.open_time) : "",
      closeTime: dayHour ? formatTime(dayHour.close_time) : ""
    };
  });

  return schedules.map(schedule => {
    if (schedule.isClosed) {
      return `${schedule.dayName}: Fechado`;
    }
    return `${schedule.dayName}: ${schedule.openTime} às ${schedule.closeTime}`;
  });
}
