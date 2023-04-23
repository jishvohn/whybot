export const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: {
      label: 'Input Node',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '2',
    data: {
      label: 'round a',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '3',
    data: {
      label: 'round b.1',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '4',
    data: {
      label: 'round b.2',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '5',
    data: {
      label: 'round b.3',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '6',
    data: {
      label: 'c.4',
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
