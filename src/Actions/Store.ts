import { Action } from "../Action";
import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";

export class StoreFrameAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'storel', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value = vm.operands.pop();
        
        const offset : number = parameters[ 0 ].value;
        
        const framePointer : number = vm.registers.framePointer;

        vm.operands.store( framePointer + offset, value );
    }
}

export class StoreGlobalAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'storeg', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value = vm.operands.pop();
        
        const offset : number = parameters[ 0 ].value;
        
        const globalPointer : number = vm.registers.globalPointer;

        vm.operands.store( globalPointer + offset, value );
    }
}

export class StoreAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'store', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value = vm.operands.pop();

        const address : Value<number> = vm.operands.pop();
        
        const offset : number = parameters[ 0 ].value;
        
        this.expect( address, [ ValueType.AddressHeap, ValueType.AddressStack ] );
        
        if ( address.type == ValueType.AddressHeap ) {
            vm.heap.store( address.value + offset, value );
        } else if ( address.type == ValueType.AddressStack ) {
            vm.operands.store( address.value + offset, value );
        }
    }
}

export class StoreNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'storen', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value = vm.operands.pop();

        const offset : Value<number> = vm.operands.pop();

        vm.operands.push( value );
        
        this.expect( offset, [ ValueType.Integer ] );

        vm.actions.get( 'store' ).execute( vm, name, [ offset ] );
    }
}
