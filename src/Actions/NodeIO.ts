import { ValueType, Value } from "../Instruction";
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

        if ( process && process.stdout && process.stdout.write ) {
            process.stdout.write( value.value.toString() );
        } else {
            console.log( value.value.toString() );
        }

        vm.valuesPool.free( value );
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

        if ( process && process.stdout && process.stdout.write ) {
            process.stdout.write( value.value.toString() );
        } else {
            console.log( value.value.toString() );
        }

        vm.valuesPool.free( value );
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

        if ( process && process.stdout && process.stdout.write ) {
            process.stdout.write( string.toString() );
        } else {
            console.log( string.toString() );
        }

        vm.valuesPool.free( value );
    }
}

export class ReadAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'read', this );
    }

    async read ( vm : StackVM ) : Promise<Value<number>> {
        let line : string = await prompt( '' );
        
        if ( line.endsWith( '\n' ) ) {
            line = line.slice( 0, line.length - 1 );
        }
        
        if ( line.endsWith( '\r' ) ) {
            line = line.slice( 0, line.length - 1 );
        }

        const address = vm.strings.store( line );

        return vm.valuesPool.acquire( ValueType.AddressString, address );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const fiber = vm.fiber;

        vm.scheduler.suspend();

        vm.scheduler.waitFor( fiber, this.read( vm ) );
    }
}