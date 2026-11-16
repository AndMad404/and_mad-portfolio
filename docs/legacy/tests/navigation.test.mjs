import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationTarget, currentSection } from '../public/navigation.mjs';

const current = 'https://portfolio.example/';
const click = { button: 0 };
const anchor = (href, extra = {}) => ({ href, hasAttribute: () => false, ...extra });

test('El indicador de sección distingue rutas, origen, búsqueda y fragmento', () => {
  assert.equal(currentSection('/#proyectos',current+'#proyectos'),true);
  for (const url of [current, current+'#contacto',current+'proyectos/fak/#proyectos',current+'?q=1#proyectos','https://external.example/#proyectos']) assert.equal(currentSection(current+'#proyectos',url),false);
});

test('Navegación interna y regreso a una sección de inicio', () => {
  assert.equal(navigationTarget(click,anchor('/proyectos/fak/'),current).pathname,'/proyectos/fak/');
  assert.equal(navigationTarget(click,anchor('/#proyectos'),current+'proyectos/fak/').hash,'#proyectos');
  assert.equal(navigationTarget(click,anchor('/#contacto'),current),null);
});

test('Respeta pestañas, descargas, enlaces externos y rutas fuera del portafolio', () => {
  for (const key of ['metaKey','ctrlKey','shiftKey','altKey','defaultPrevented']) assert.equal(navigationTarget({...click,[key]:true},anchor('/proyectos/fak/'),current),null);
  assert.equal(navigationTarget({button:1},anchor('/proyectos/fak/'),current),null);
  for (const href of ['https://external.example/','mailto:someone@example.com','/cv.pdf','/admin/','/api/publish']) assert.equal(navigationTarget(click,anchor(href),current),null);
  assert.equal(navigationTarget(click,anchor('/proyectos/fak/',{target:'_blank'}),current),null);
  assert.equal(navigationTarget(click,anchor('/proyectos/fak/',{hasAttribute:()=>true}),current),null);
  assert.equal(navigationTarget(click,anchor('/proyectos/fak/',{rel:'external'}),current),null);
});
