import { Component, Element, Prop, State, Watch } from '@stencil/core';

import autobind from '~decorators/autobind';
import { ItemData } from '~helpers/declarations';
import { Injector } from '~helpers/injector';

@Component({
  tag: 'sti-item-value',
  styleUrl: 'item-value.pcss',
  shadow: true
})
export class ItemValue {

  @Prop() canExpand = false;

  @Prop() expanded = false;

  @Prop() onExpand: (event: MouseEvent) => void;

  @Prop() item: ItemData;

  @Prop() dark = false;

  @State() value: string;

  @State() editMode = false;

  private valueSent = true;

  @Element()
  private $element;

  @Watch('item')
  protected initialValueChangeHandler() {
    this.value = this.item.value.toString();

    this.valueSent = true;
  }

  protected componentWillLoad() {
    this.value = this.item.value.toString();

    this.valueSent = true;
  }

  protected componentDidUpdate() {
    const inputElement: HTMLInputElement = this.$element.shadowRoot.querySelector('input');

    if (inputElement) {
      if (document.activeElement !== inputElement) {
        inputElement.focus();
      }
    }
  }

  protected hostData() {
    return {
      class: {
        edit: this.editMode,
        dark: this.dark
      }
    };
  }

  private updateValue(newValue: string | number | boolean) {
    const {
      edit: {
        type,
        member,
        instance
      }
    } = this.item;

    Injector.Instance.updateValue(member, newValue, type, instance);
  }

  @autobind
  private valueClickHandler() {
    const {
      edit: {
        enable,
        type
      }
    } = this.item;

    if (enable && !this.editMode) {
      if (type === 'boolean') {
        const nextValue: boolean = !this.value || this.value === 'false' || this.value === 'undefined' ? true : false;

        this.updateValue(nextValue);
      } else {
        this.editMode = true;
      }
    }
  }

  @autobind
  private inputKeyDownHandler(evt: KeyboardEvent) {
    switch (evt.keyCode) {
      case 13: // enter key
        evt.preventDefault();

        this.editMode = false;

        if (!this.valueSent) {
          this.updateValue(this.value);
        }
        break;

      case 27: // esc key
        this.value = this.item.value;

        this.editMode = false;

        this.valueSent = true;
        break;
    }
  }

  @autobind
  private inputBlurHandler() {
    this.editMode = false;

    if (!this.valueSent) {
      this.updateValue(this.value);
    }
  }

  @autobind
  private inputChangeHandler(evt: UIEvent) {
    this.value = (evt.currentTarget as HTMLInputElement).value.toString();
    this.valueSent = false;
  }

  protected render() {
    if (!this.editMode) {
      return [
        this.canExpand && this.item.expand.enable ?
          <sti-arrow
            direction={this.expanded}
            onClick={this.onExpand}
            class="arrow"
          /> :
          null,
        <span
          class={{
            value: true,
            print: this.item.type === 'function',
            [this.item.type]: true,
            canEdit: this.item.edit.enable
          }}
          onClick={this.valueClickHandler}
        >
          {this.value}
        </span>
      ];
    }

    return (
      <input
        type={this.item.type === 'number' ? 'number' : 'text'}
        class="input"
        onKeyDown={this.inputKeyDownHandler}
        onBlur={this.inputBlurHandler}
        onChange={this.inputChangeHandler}
        value={this.value.toString()}
      />
    );
  }
}
