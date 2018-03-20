import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'sti-message',
  styleUrl: 'message.pcss',
  shadow: true
})
export class Message {

  @Prop() message = '';

  @Prop() dark = false;

  protected hostData() {
    return {
      class: {
        dark: this.dark,
        hidden: this.message.length === 0
      }
    };
  }

  protected render() {
    return this.message;
  }
}
