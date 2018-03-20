import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'sti-arrow',
  styleUrl: 'arrow.pcss',
  shadow: true
})
export class Arrow {

  @Prop() direction = true;

  protected hostData() {
    return {
      class: {
        down: this.direction
      }
    };
  }

  protected render() {
    return this.direction ? '▼' : '▶';
  }
}
