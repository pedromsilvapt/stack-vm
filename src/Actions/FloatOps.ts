import { ValueType, Value } from "../Instruction";
import { Action } from "../Action";
import { StackVM } from "../StackVM";

export class BinaryFloatOp extends Action {
    parameters : ValueType[] = [];
    
    setup ( vm : StackVM ) {
        vm.actions.set( 'fadd', this );
        vm.actions.set( 'fsub', this );
        vm.actions.set( 'fmul', this );
        vm.actions.set( 'fdiv', this );
        vm.actions.set( 'finf', this );
        vm.actions.set( 'finfeq', this );
        vm.actions.set( 'fsup', this );
        vm.actions.set( 'fsupeq', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const op2 : Value<number> = vm.operands.pop();
        const op1 : Value<number> = vm.operands.pop();

        this.expect( op2, ValueType.Float );
        this.expect( op1, ValueType.Float );

        let value : number;

        if ( name == 'fadd' ) {
            value = op1.value + op2.value;
        } else if ( name == 'fsub' ) {
            value = op1.value - op2.value;
        } else if ( name == 'fmul' ) {
            value = op1.value * op2.value;
        } else if ( name == 'fdiv' ) {
            value = op1.value / op2.value;
        } else if ( name == 'finf' ) {
            value = op1.value < op2.value ? 1 : 0;
        } else if ( name == 'finfeq' ) {
            value = op1.value <= op2.value ? 1 : 0;
        } else if ( name == 'fsup' ) {
            value = op1.value > op2.value ? 1 : 0;
        } else if ( name == 'fsupeq' ) {
            value = op1.value >= op2.value ? 1 : 0;
        } else {
            throw new Error( `Unknown float binary operand ${ name }.` );
        }

        vm.operands.push( new Value( ValueType.Float, value ) );
    }
}

export class UnaryFloatOp extends Action {
    parameters : ValueType[] = [];
    
    setup ( vm : StackVM ) {
        vm.actions.set( 'fcos', this );
        vm.actions.set( 'fsin', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const op : Value<number> = vm.operands.pop();

        this.expect( op, ValueType.Float );

        let value : number;

        if ( name == 'fcos' ) {
            value = Math.cos( op.value );
        } else if ( name == 'fsin' ) {
            value = Math.sin( op.value );
        } else {
            throw new Error( `Unknown float unary operand ${ name }.` );
        }

        vm.operands.push( new Value( ValueType.Float, value ) );
    }
}