import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const destinations = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/destinations' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      country: z.string(),
      image: image(),
      start: z.coerce.date(),
      end: z.coerce.date(),
      summary: z.string(),
      order: z.number(),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['webinar', 'workshop']),
    /** ISO date with the Romanian offset, e.g. 2026-10-13T19:00:00+03:00 */
    start: z.coerce.date(),
    durationMin: z.number(),
    trainer: z.string(),
    seatsLeft: z.number(),
    location: z.string(),
    url: z.string(),
  }),
});

const community = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/community' }),
  schema: ({ image }) =>
    z.object({
      image: image(),
      caption: z.string(),
      destination: z.string(),
      year: z.number(),
      order: z.number(),
      /** community feed post */
      type: z.enum(['vacanta', 'eveniment']),
      author: z.string(),
      home: z.string(),
      date: z.coerce.date(),
      text: z.string(),
    }),
});

export const collections = { destinations, events, community };
