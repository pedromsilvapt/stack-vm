import { ValueType, Value, TypeMismatchError } from "../Instruction";
import { StackVM } from "../StackVM";
import { Action } from "../Action";
import { prompt } from 'node-ask';

export class WriteIntegerAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'writei', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value<number> = vm.operands.pop();

        this.expect( value, ValueType.Integer );

        process.stdout.write( value.value.toString() );
    }
}

export class WriteFloatAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'writef', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value<number> = vm.operands.pop();

        this.expect( value, ValueType.Float );

        process.stdout.write( value.value.toString() );
    }
}

export class WriteStringAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'writes', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value<number> = vm.operands.pop();

        this.expect( value, ValueType.AddressString );
        
        const string = vm.strings.load( value.value );

        process.stdout.write( string );
    }
}

export class ReadAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'read', this );
    }

    async execute ( vm : StackVM, name : string, parameters : Value[] ) {
        let line : string = await prompt( '' );
        
        if ( line.endsWith( '\n' ) ) {
            line = line.slice( 0, line.length - 1 );
        }
        
        if ( line.endsWith( '\r' ) ) {
            line = line.slice( 0, line.length - 1 );
        }

        const address = vm.strings.store( line );

        vm.operands.push( new Value( ValueType.AddressString, address ) );
    }
}