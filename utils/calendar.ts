import { Event } from '../types';

export const generateGoogleCalendarUrl = (event: Event) => {
  const startTime = new Date(event.date);
  // Default duration 2 hours if not specified, calculating end time
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: `${event.description}\n\nBooked via EventForge.`,
    location: event.location,
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};