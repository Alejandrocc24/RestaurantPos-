import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { GruposModificadoresComponent } from './grupos-modificadores.component';
import { GrupoModificadorModalComponent } from './grupo-modificador-modal.component';

describe('GruposModificadoresComponent', () => {
  let component: GruposModificadoresComponent;
  let fixture: ComponentFixture<GruposModificadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruposModificadoresComponent, FormsModule, GrupoModificadorModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GruposModificadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.sidebarVisible).toBeFalse();
    expect(component.grupos).toEqual([]);
    expect(component.gruposFiltrados).toEqual([]);
    expect(component.terminoBusqueda).toBe('');
    expect(component.tipoSeleccionado).toBe('Todos');
  });

  it('should load sample data on init', () => {
    component.ngOnInit();
    expect(component.grupos.length).toBeGreaterThan(0);
    expect(component.gruposFiltrados.length).toBeGreaterThan(0);
  });

  it('should filter by type correctly', () => {
    component.cargarGruposModificadores();
    component.filtrarPorTipo('Único');
    expect(component.tipoSeleccionado).toBe('Único');
    expect(component.gruposFiltrados.every(g => g.tipo === 'unico')).toBeTrue();
  });

  it('should filter by search term', () => {
    component.cargarGruposModificadores();
    component.terminoBusqueda = 'helado';
    component.filtrarPorBusqueda();
    expect(component.gruposFiltrados.length).toBeGreaterThan(0);
  });

  it('should toggle sidebar', () => {
    const initialState = component.sidebarVisible;
    component.toggleSidebar();
    expect(component.sidebarVisible).toBe(!initialState);
  });

  it('should close sidebar', () => {
    component.sidebarVisible = true;
    component.closeSidebar();
    expect(component.sidebarVisible).toBeFalse();
  });

  it('should open modal for new group', () => {
    component.nuevoGrupo();
    expect(component.mostrarModalGrupo).toBeTrue();
    expect(component.esEdicionGrupo).toBeFalse();
    expect(component.grupoSeleccionado).toBeNull();
  });

  it('should open modal for editing group', () => {
    component.cargarGruposModificadores();
    const grupo = component.grupos[0];
    component.editarGrupo(grupo);
    expect(component.mostrarModalGrupo).toBeTrue();
    expect(component.esEdicionGrupo).toBeTrue();
    expect(component.grupoSeleccionado).toEqual(grupo);
  });

  it('should change group status', () => {
    component.cargarGruposModificadores();
    const grupo = component.grupos[0];
    const initialStatus = grupo.estado;
    component.cambiarEstado(grupo);
    expect(grupo.estado).not.toBe(initialStatus);
  });

  it('should get correct display values', () => {
    expect(component.getTipoDisplay('unico')).toBe('Único');
    expect(component.getTipoDisplay('multiple')).toBe('Múltiple');
    expect(component.getObligatorioDisplay(true)).toBe('Sí');
    expect(component.getObligatorioDisplay(false)).toBe('No');
  });

  it('should count modifiers correctly', () => {
    component.cargarGruposModificadores();
    const grupo = component.grupos[0];
    const count = component.getModificadoresCount(grupo);
    expect(count).toBe(grupo.modificadores.length);
  });
});
