import { Directive, Output, HostListener, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appCapsLockDetect]',
  standalone: true
})
export class CapsLockDetectDirective {
  @Output() capsLockState = new EventEmitter(); 

  constructor() { }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const capsLockState = event.getModifierState('CapsLock')
    this.capsLockState.emit(capsLockState)
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    const capsLockState = event.getModifierState('CapsLock')
    this.capsLockState.emit(capsLockState)
  }
}
