import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";
import { Action } from "../Action";

export class StringToIntAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'atoi', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : Value<number> = vm.operands.pop();
        
        this.expect( address, ValueType.AddressString );

        const str = vm.strings.load( address.value );

        vm.valuesPool.free( address );

        vm.operands.push( vm.valuesPool.acquire( ValueType.Integer, Number.parseInt( str, 10 ) ) );
    }
}

export class StringToFloatAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'atof', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const address : Value<number> = vm.operands.pop();
        
        this.expect( address, ValueType.AddressString );

        const str = vm.strings.load( address.value );

        vm.valuesPool.free( address );

        vm.operands.push( vm.valuesPool.acquire( ValueType.Float, Number.parseFloat( str ) ) );
    }
}

export class IntToFloatAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'itof', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const number : Value<number> = vm.operands.pop();
        
        this.expect( number, ValueType.Integer );

        vm.valuesPool.free( number );

        vm.operands.push( vm.valuesPool.acquire( ValueType.Float, number.value ) );
    }
}

export class FloatToIntAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'ftoi', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const number : Value<number> = vm.operands.pop();
        
        this.expect( number, ValueType.Float );

        vm.valuesPool.free( number );

        vm.operands.push( vm.valuesPool.acquire( ValueType.Integer, Math.floor( number.value ) ) );
    }
}

export class IntToStringAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'stri', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const number : Value<number> = vm.operands.pop();
        
        this.expect( number, ValueType.Integer );

        const address = vm.strings.store( '' + number.value );

        vm.valuesPool.free( number );

        vm.operands.push( vm.valuesPool.acquire( ValueType.AddressString, address ) );
    }
}

export class FloatToStringAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'strf', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const number : Value<number> = vm.operands.pop();
        
        this.expect( number, ValueType.Float );

        const address = vm.strings.store( '' + number.value );

        vm.valuesPool.free( number );

        vm.operands.push( vm.valuesPool.acquire( ValueType.AddressString, address ) );
    }
}