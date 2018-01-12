import { ValueType, Value } from "../Instruction";
import { Action } from "../Action";
import { StackVM } from "../StackVM";

export class BinaryIntOp extends Action {
    parameters : ValueType[] = [];
    
    setup ( vm : StackVM ) {
        vm.actions.set( 'add', this );
        vm.actions.set( 'sub', this );
        vm.actions.set( 'mul', this );
        vm.actions.set( 'div', this );
        vm.actions.set( 'mod', this );
        vm.actions.set( 'inf', this );
        vm.actions.set( 'infeq', this );
        vm.actions.set( 'sup', this );
        vm.actions.set( 'supeq', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const op2 : Value<number> = vm.operands.pop();
        const op1 : Value<number> = vm.operands.pop();

        this.expect( op2, ValueType.Integer );
        this.expect( op1, ValueType.Integer );

        let value : number;

        if ( name == 'add' ) {
            value = op1.value + op2.value;
        } else if ( name == 'sub' ) {
            value = op1.value - op2.value;
        } else if ( name == 'mul' ) {
            value = op1.value * op2.value;
        } else if ( name == 'div' ) {
            value = Math.floor( op1.value / op2.value );
        } else if ( name == 'mod' ) {
            value = op1.value % op2.value;
        } else if ( name == 'inf' ) {
            value = op1.value < op2.value ? 1 : 0;
        } else if ( name == 'infeq' ) {
            value = op1.value <= op2.value ? 1 : 0;
        } else if ( name == 'sup' ) {
            value = op1.value > op2.value ? 1 : 0;
        } else if ( name == 'supeq' ) {
            value = op1.value >= op2.value ? 1 : 0;
        } else {
            throw new Error( `Unknown int binary operand ${ name }.` );
        }

        vm.operands.push( new Value( ValueType.Integer, value ) );
    }
}
export class UnaryIntOp extends Action {
    parameters : ValueType[] = [];
    
    setup ( vm : StackVM ) {
        vm.actions.set( 'not', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const op : Value<number> = vm.operands.pop();

        this.expect( op, ValueType.Integer );

        let value : number;

        if ( name == 'not' ) {
            value = op.value == 0 ? 1 : 0;
        } else {
            throw new Error( `Unknown int unary operand ${ name }.` );
        }

        vm.operands.push( new Value( ValueType.Integer, value ) );
    }
}