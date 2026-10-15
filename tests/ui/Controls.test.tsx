import React, { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Checkbox from '../../components/ui/Checkbox'
import Switch from '../../components/ui/Switch'
import RadioGroup from '../../components/ui/Radio'
import Select from '../../components/ui/Select'

afterEach(cleanup)

function ControlledControls() {
  const [checked, setChecked] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [radio, setRadio] = useState('one')
  const [choice, setChoice] = useState('a')
  return <>
    <Checkbox label="Accept terms" checked={checked} onChange={setChecked} />
    <Checkbox label="Locked" checked={false} onChange={() => {}} disabled />
    <Switch label="Automation" checked={enabled} onChange={setEnabled} />
    <RadioGroup name="choice" value={radio} onChange={setRadio} options={[{ value: 'one', label: 'First' }, { value: 'two', label: 'Second' }, { value: 'disabled', label: 'Unavailable', disabled: true }]} />
    <Select label="Provider" value={choice} onChange={(event) => setChoice(event.target.value)} options={[{ value: 'a', label: 'Provider A' }, { value: 'b', label: 'Provider B' }, { value: 'c', label: 'Provider C', disabled: true }]} />
    <output>{`${checked}|${enabled}|${radio}|${choice}`}</output>
  </>
}

describe('shared controls', () => {
  it('supports labeled checkbox and switch activation with disabled protection', () => {
    render(<ControlledControls />)
    fireEvent.click(screen.getByLabelText('Accept terms'))
    fireEvent.click(screen.getByRole('switch', { name: 'Automation' }))
    fireEvent.click(screen.getByLabelText('Locked'))
    expect(screen.getByText('true|true|one|a')).toBeTruthy()
  })

  it('updates radio and select values and prevents disabled choices', () => {
    render(<ControlledControls />)
    fireEvent.click(screen.getByText('Second').closest('label')!)
    const select = screen.getByRole('combobox', { name: 'Provider' })
    fireEvent.keyDown(select, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.keyDown(select, { key: 'ArrowDown' })
    expect(select.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Provider B' }).id)
    fireEvent.keyDown(select, { key: 'Enter' })
    expect(screen.getByText('false|false|two|b')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Provider C' }).getAttribute('aria-disabled')).toBe('true')
  })
})
