import anaconda from '../assets/skills/anaconda.svg';
import django from '../assets/skills/django.png';
import docker from '../assets/skills/docker.svg';
import flask from '../assets/skills/flask.png';
import github from '../assets/skills/github.png';
import tensorflow from '../assets/skills/tensorflow.svg';
import rstudio from '../assets/skills/rstudio.svg';
import r from '../assets/skills/r.svg';
import python from '../assets/skills/python.svg';
import canva from '../assets/skills/canva.svg';
import figma from '../assets/skills/figma.svg';
import wordpress from '../assets/skills/wordpress.png';
import opencv from '../assets/skills/opencv.svg';
import numpy from '../assets/skills/numpy.svg';
import mysql from '../assets/skills/mysql.svg';
import matplotlib from '../assets/skills/matplotlib.svg';
import jupyter from '../assets/skills/jupyter.png';
import pandas from '../assets/skills/pandas.png';
import streamlit from '../assets/skills/streamlit.svg';
import fastapi from '../assets/skills/fastapi.svg';
import flaskBlack from '../assets/skills/flask-black.svg';

export interface Skill { name: string; img: ImageMetadata }

/**
 * The home-page stack, as the site owner listed it. This is a visual strip only: it is not part of the assistant's
 * knowledge base, which is built from the evidence-linked content instead. Logos are self-hosted (no third-party requests).
 */
export const row1: Skill[] = [
  { name: 'Anaconda', img: anaconda }, { name: 'Django', img: django }, { name: 'Docker', img: docker },
  { name: 'Flask', img: flask }, { name: 'GitHub', img: github }, { name: 'TensorFlow', img: tensorflow },
  { name: 'RStudio', img: rstudio }, { name: 'R', img: r }, { name: 'Python', img: python },
];
export const row2: Skill[] = [
  { name: 'Canva', img: canva }, { name: 'Figma', img: figma }, { name: 'WordPress', img: wordpress },
  { name: 'OpenCV', img: opencv }, { name: 'NumPy', img: numpy }, { name: 'MySQL', img: mysql },
  { name: 'Matplotlib', img: matplotlib }, { name: 'Jupyter', img: jupyter }, { name: 'Pandas', img: pandas },
  { name: 'Streamlit', img: streamlit }, { name: 'FastAPI', img: fastapi }, { name: 'Flask', img: flaskBlack },
];
