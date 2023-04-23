import React from 'react'
import {FadeoutTextNode} from "./FadeoutTextNode";

export const initialNodes = [
  {
    id: '1',
    type: 'fadeText',
    data: {
      text: 'Why is the meaning of life 42?',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '2',
      type: 'fadeText',
    data: {
      text: 'round a',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '3',
      type: 'fadeText',
    data: {
      text: 'round b.1',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '4',
      type: 'fadeText',
    data: {
      text: 'round b.2',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '5',
      type: 'fadeText',
    data: {
      text: 'round b.3',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '6',
      type: 'fadeText',
    data: {
      text: 'c.4',
    },
    position: { x: 0, y: 0 },
  },
]

export const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true },
    { id: 'e2-4', source: '2', target: '4', animated: true },
    { id: 'e2-5', source: '2', target: '5', animated: true },
    { id: 'e4-6', source: '4', target: '6', animated: true },
]
