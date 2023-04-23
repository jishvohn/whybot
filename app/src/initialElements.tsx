import React from 'react'
import {FadeoutTextNode} from "./FadeoutTextNode";
import {MarkerType} from "reactflow";

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
      text: 'The idea that the meaning of life is 42 comes from a science fiction novel, "The Hitchhiker\'s Guide to the Galaxy" by Douglas Adams. In the story, a group of hyper-intelligent beings build a supercomputer named Deep Thought to calculate the ultimate',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '3',
      type: 'fadeText',
    data: {
      text: 'The idea that the meaning of life is 42 comes from a science fiction novel, "The Hitchhiker\'s Guide to the Galaxy" by Douglas Adams. In the story, a group of hyper-intelligent beings build a supercomputer named Deep Thought to calculate the ultimate',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '4',
      type: 'fadeText',
    data: {
      text: 'The idea that the meaning of life is 42 comes from a science fiction novel, "The Hitchhiker\'s Guide to the Galaxy" by Douglas Adams. In the story, a group of hyper-intelligent beings build a supercomputer named Deep Thought to calculate the ultimate',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '5',
      type: 'fadeText',
    data: {
      text: 'The idea that the meaning of life is 42 comes from a science fiction novel, "The Hitchhiker\'s Guide to the Galaxy" by Douglas Adams. In the story, a group of hyper-intelligent beings build a supercomputer named Deep Thought to calculate the ultimate',
    },
    position: { x: 0, y: 0 },
  },
    {
    id: '6',
      type: 'fadeText',
    data: {
      text: 'The idea that the meaning of life is 42 comes from a science fiction novel, "The Hitchhiker\'s Guide to the Galaxy" by Douglas Adams. In the story, a group of hyper-intelligent beings build a supercomputer named Deep Thought to calculate the ultimate',
    },
    position: { x: 0, y: 0 },
  },
]

export const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: {type: MarkerType.Arrow} },
    { id: 'e2-3', source: '2', target: '3', animated: true, markerEnd: {type: MarkerType.Arrow} },
    { id: 'e2-4', source: '2', target: '4', animated: true, markerEnd: {type: MarkerType.Arrow} },
    { id: 'e2-5', source: '2', target: '5', animated: true, markerEnd: {type: MarkerType.Arrow} },
    { id: 'e4-6', source: '4', target: '6', animated: true, markerEnd: {type: MarkerType.Arrow} },
]
